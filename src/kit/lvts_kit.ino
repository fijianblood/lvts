// LvTS Kit Firmware for the duinotech Learning Kit (Arduino Uno compatible)
// LomaVata Tech Services - https://fijianblood.github.io/lvts/labview/
//
// One serial protocol for every part of the kit, so LabVIEW (NI-VISA), a web
// page (Web Serial) or the Arduino Serial Monitor can drive it the same way.
// 9600 baud, 8N1. One command per line, ending with '\n'. Replies end with CRLF.
//
//   PING                 -> PONG
//   LED ON | LED OFF     -> OK LED ON        (built-in LED, pin 13)
//   RED ON | RED OFF     -> OK RED ON        (red LED, pin 7)
//   GREEN ON | GREEN OFF -> OK GREEN ON      (green LED, pin 8)
//   RGB r g b            -> OK RGB r g b     (0-255 each, pins 3/5/6)
//   SERVO a              -> OK SERVO a       (0-180 degrees, pin 9)
//   BEEP f ms            -> OK BEEP f ms     (100-5000 Hz, 10-2000 ms, pin A5)
//   MATRIX r0 .. r7      -> OK MATRIX        (8 rows as hex 00-FF, top row first)
//   MATRIX CLEAR         -> OK MATRIX
//   STATUS               -> POT=512 LDR=300 JX=510 JY=520 JSW=0 BTN=0 LINE=1 LED=0
//   anything else        -> ERR <reason>
//
// Wiring (all grounds joined, modules powered from 5V):
//   Potentiometer middle pin -> A0      LDR module analog out   -> A1
//   Joystick VRx -> A2, VRy -> A3, SW -> D4
//   Line trace module digital out -> A4 Piezo buzzer module signal -> A5
//   Button -> D2 and GND                Red LED + 220 ohm -> D7, green LED + 220 ohm -> D8
//   RGB LED module R -> D3, G -> D5, B -> D6
//   Servo: brown GND, red 5V, orange signal -> D9
//   8x8 matrix (MAX7219): DIN -> D12, CLK -> D11, CS -> D10

#include <Servo.h>
#include <stdlib.h>
#include <string.h>

const uint8_t PIN_BTN = 2;
const uint8_t PIN_R = 3;
const uint8_t PIN_JSW = 4;
const uint8_t PIN_G = 5;
const uint8_t PIN_B = 6;
const uint8_t PIN_RED = 7;
const uint8_t PIN_GREEN = 8;
const uint8_t PIN_SERVO = 9;
const uint8_t PIN_CS = 10;
const uint8_t PIN_CLK = 11;
const uint8_t PIN_DIN = 12;
const uint8_t PIN_LED = 13;
const uint8_t PIN_POT = A0;
const uint8_t PIN_LDR = A1;
const uint8_t PIN_JX = A2;
const uint8_t PIN_JY = A3;
const uint8_t PIN_LINE = A4;
const uint8_t PIN_BUZZ = A5;

const uint8_t MAX_LINE = 47;
char line[MAX_LINE + 1];
uint8_t lineLen = 0;
bool lineTooLong = false;
Servo servo;

// ---- MAX7219 8x8 LED matrix (driven directly, no library needed) ----------
void matrixWrite(uint8_t reg, uint8_t value) {
  digitalWrite(PIN_CS, LOW);
  shiftOut(PIN_DIN, PIN_CLK, MSBFIRST, reg);
  shiftOut(PIN_DIN, PIN_CLK, MSBFIRST, value);
  digitalWrite(PIN_CS, HIGH);
}

void matrixClear() {
  for (uint8_t row = 1; row <= 8; row++) matrixWrite(row, 0);
}

void matrixInit() {
  pinMode(PIN_DIN, OUTPUT);
  pinMode(PIN_CLK, OUTPUT);
  pinMode(PIN_CS, OUTPUT);
  digitalWrite(PIN_CS, HIGH);
  matrixWrite(0x0F, 0x00);  // display test off
  matrixWrite(0x09, 0x00);  // no BCD decode: raw rows
  matrixWrite(0x0B, 0x07);  // scan all 8 rows
  matrixWrite(0x0A, 0x02);  // low brightness (0-15): easier on USB power
  matrixClear();
  matrixWrite(0x0C, 0x01);  // leave shutdown mode
}

// ---- Piezo buzzer: a short square wave without tone(), so PWM on pin 3 keeps working
void beep(long hz, long ms) {
  unsigned long halfPeriod = 500000UL / (unsigned long)hz;
  unsigned long cycles = (unsigned long)hz * (unsigned long)ms / 1000UL;
  for (unsigned long i = 0; i < cycles; i++) {
    digitalWrite(PIN_BUZZ, HIGH);
    delayMicroseconds(halfPeriod);
    digitalWrite(PIN_BUZZ, LOW);
    delayMicroseconds(halfPeriod);
  }
}

// ---- Parsing helpers --------------------------------------------------------
// Reads one whole number from *p (decimal, or hex when base is 16) and moves *p past it.
bool readNumber(char **p, int base, long minV, long maxV, long *out) {
  while (**p == ' ') (*p)++;
  if (**p == '\0') return false;
  char *end;
  long v = strtol(*p, &end, base);
  if (end == *p || (*end != ' ' && *end != '\0')) return false;
  if (v < minV || v > maxV) return false;
  *p = end;
  *out = v;
  return true;
}

bool atEnd(char *p) {
  while (*p == ' ') p++;
  return *p == '\0';
}

// "ON" or "OFF" after a word like "LED"; returns 1, 0 or -1 for neither.
int onOff(const char *rest) {
  if (strcmp(rest, " ON") == 0) return 1;
  if (strcmp(rest, " OFF") == 0) return 0;
  return -1;
}

bool startsWith(const char *s, const char *word) {
  size_t n = strlen(word);
  return strncmp(s, word, n) == 0 && (s[n] == '\0' || s[n] == ' ');
}

void setDigital(const char *name, uint8_t pin, const char *rest) {
  int v = onOff(rest);
  if (v < 0) {
    Serial.print("ERR USE ");
    Serial.print(name);
    Serial.println(" ON OR OFF");
    return;
  }
  digitalWrite(pin, v ? HIGH : LOW);
  Serial.print("OK ");
  Serial.print(name);
  Serial.println(v ? " ON" : " OFF");
}

void handleCommand(char *cmd) {
  // Trim spaces at both ends and make it upper case.
  while (*cmd == ' ') cmd++;
  size_t n = strlen(cmd);
  while (n > 0 && cmd[n - 1] == ' ') cmd[--n] = '\0';
  for (size_t i = 0; i < n; i++) {
    if (cmd[i] >= 'a' && cmd[i] <= 'z') cmd[i] -= 32;
  }
  if (n == 0) return;

  if (strcmp(cmd, "PING") == 0) {
    Serial.println("PONG");
  } else if (startsWith(cmd, "LED")) {
    setDigital("LED", PIN_LED, cmd + 3);
  } else if (startsWith(cmd, "RED")) {
    setDigital("RED", PIN_RED, cmd + 3);
  } else if (startsWith(cmd, "GREEN")) {
    setDigital("GREEN", PIN_GREEN, cmd + 5);
  } else if (startsWith(cmd, "RGB")) {
    char *p = cmd + 3;
    long r, g, b;
    if (readNumber(&p, 10, 0, 255, &r) && readNumber(&p, 10, 0, 255, &g) &&
        readNumber(&p, 10, 0, 255, &b) && atEnd(p)) {
      analogWrite(PIN_R, (int)r);
      analogWrite(PIN_G, (int)g);
      analogWrite(PIN_B, (int)b);
      Serial.print("OK RGB "); Serial.print(r); Serial.print(' ');
      Serial.print(g); Serial.print(' '); Serial.println(b);
    } else {
      Serial.println("ERR USE RGB 0-255 0-255 0-255");
    }
  } else if (startsWith(cmd, "SERVO")) {
    char *p = cmd + 5;
    long a;
    if (readNumber(&p, 10, 0, 180, &a) && atEnd(p)) {
      servo.write((int)a);
      Serial.print("OK SERVO ");
      Serial.println(a);
    } else {
      Serial.println("ERR USE SERVO 0-180");
    }
  } else if (startsWith(cmd, "BEEP")) {
    char *p = cmd + 4;
    long hz, ms;
    if (readNumber(&p, 10, 100, 5000, &hz) && readNumber(&p, 10, 10, 2000, &ms) && atEnd(p)) {
      beep(hz, ms);
      Serial.print("OK BEEP "); Serial.print(hz); Serial.print(' '); Serial.println(ms);
    } else {
      Serial.println("ERR USE BEEP 100-5000 10-2000");
    }
  } else if (startsWith(cmd, "MATRIX")) {
    char *p = cmd + 6;
    if (strcmp(p, " CLEAR") == 0) {
      matrixClear();
      Serial.println("OK MATRIX");
      return;
    }
    long rows[8];
    for (uint8_t i = 0; i < 8; i++) {
      if (!readNumber(&p, 16, 0, 255, &rows[i])) {
        Serial.println("ERR USE MATRIX + 8 HEX ROWS 00-FF");
        return;
      }
    }
    if (!atEnd(p)) {
      Serial.println("ERR USE MATRIX + 8 HEX ROWS 00-FF");
      return;
    }
    for (uint8_t i = 0; i < 8; i++) matrixWrite(i + 1, (uint8_t)rows[i]);
    Serial.println("OK MATRIX");
  } else if (strcmp(cmd, "STATUS") == 0) {
    Serial.print("POT=");   Serial.print(analogRead(PIN_POT));
    Serial.print(" LDR=");  Serial.print(analogRead(PIN_LDR));
    Serial.print(" JX=");   Serial.print(analogRead(PIN_JX));
    Serial.print(" JY=");   Serial.print(analogRead(PIN_JY));
    Serial.print(" JSW=");  Serial.print(digitalRead(PIN_JSW) == LOW ? 1 : 0);
    Serial.print(" BTN=");  Serial.print(digitalRead(PIN_BTN) == LOW ? 1 : 0);
    Serial.print(" LINE="); Serial.print(digitalRead(PIN_LINE));
    Serial.print(" LED=");  Serial.println(digitalRead(PIN_LED));
  } else {
    Serial.print("ERR UNKNOWN ");
    Serial.println(cmd);
  }
}

void setup() {
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_R, OUTPUT);
  pinMode(PIN_G, OUTPUT);
  pinMode(PIN_B, OUTPUT);
  pinMode(PIN_BUZZ, OUTPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);   // pressed = LOW
  pinMode(PIN_JSW, INPUT_PULLUP);   // pressed = LOW
  pinMode(PIN_LINE, INPUT);
  servo.attach(PIN_SERVO);
  servo.write(90);
  matrixInit();
  Serial.begin(9600);
  Serial.println("READY LVTS KIT");  // printed on every reset (opening the port resets an Uno)
}

void loop() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n') {
      line[lineLen] = '\0';
      if (lineTooLong) Serial.println("ERR TOO LONG");
      else handleCommand(line);
      lineLen = 0;
      lineTooLong = false;
    } else if (c != '\r') {
      if (lineLen < MAX_LINE) line[lineLen++] = c;
      else lineTooLong = true;
    }
  }
}
