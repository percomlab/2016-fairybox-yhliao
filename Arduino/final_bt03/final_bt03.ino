const int AIA = 3;  // (pwm) pin 9 connected to pin A-IA
const int AIB = 5;  // (pwm) pin 5 connected to pin A-IB
const int BIA = 9; // (pwm) pin 10 connected to pin B-IA
const int BIB = 6;  // (pwm) pin 6 connected to pin B-IB

byte speed = 255;  // change this (0-255) to control the speed of the motors
boolean carMoving;

#include <SPI.h>
#include <MFRC522.h>
#include <SoftwareSerial.h>

/* Set your new UID here! */
#define NEW_UID {0xDE, 0xAD, 0xBE, 0xEF}
#define SS_PIN 10
#define RST_PIN 4

MFRC522 mfrc522(SS_PIN, RST_PIN);        // Create MFRC522 instance.
MFRC522::MIFARE_Key key;
SoftwareSerial btserial(7,  8); // RX, TX

String readCardUID; // 車子存下的ID（使用者放置的位置）
String cardUID; // 車子讀到的卡片
String startOffPoint; // 車子從置物櫃出發的點，必須在起點
String readCardUIDArea; // 歸位模式起點卡片區塊
String savedCardUIDArea; // 出動模式目標卡片區塊
String testCardUIDArea; // 要傳給server的卡片座標
String context1; // 3個情境儲存位置
String context2;
String context3;
char carId = 'C';
char sendRFIDX;
char sendRFIDY;
boolean sendComeBackSwitch = true;
int statue;
char parkingTarget; // 歸位模式目標停車位
char currentParking; // 出動模式起點停車位

void setup() {
  pinMode(AIA, OUTPUT); // set pins to output
  pinMode(AIB, OUTPUT);
  pinMode(BIA, OUTPUT);
  pinMode(BIB, OUTPUT);
  carMoving = false;

  Serial.begin(19200);        // Initialize serial communications with the PC
  btserial.begin(9600);
  while (!Serial);           // Do nothing if no serial port is opened (added for Arduinos based on ATMEGA32U4)
  SPI.begin();               // Init SPI bus
  mfrc522.PCD_Init();        // Init MFRC522 card

  statue = 1;
}

void loop() {

  //----------------statues control-------------

  switch (statue) {
    case 1: {
        initial();
        break;
      }
    case 2: {
        Serial.println("Enter case 2");
        // readCardUIDArea = 目前車所在位置
        // parkingTarget = 車要去的停車位
        comeBack(readCardUIDArea, parkingTarget);
        break;
      }
    case 3: {
        Serial.println("Enter case 3");
        // savedCardUIDArea = 車要去的在桌面上的方格
        // currentParking = 車現在在的停車位
        startOff(savedCardUIDArea, currentParking);
        break;
      }
  }

  //-------------------BT control------------------

  if (btserial.available()) {
    char rec = btserial.read();
    Serial.println(rec);

    //**********BT received comeBack message ('c')************
    // 使用者按下歸位/出動模式按鈕，車車讀到底下的卡片轉成座標，連車子編號一起傳給server
    if (rec == 'c') {
      Serial.println("received c");
      // save readCardUID
      if ( ! mfrc522.PICC_IsNewCardPresent() || ! mfrc522.PICC_ReadCardSerial() ) {
        delay(50);
        Serial.println("Please put it on a point.");
      } else {
        String testCardUID = "";
        for (byte i = 0; i < mfrc522.uid.size; i++) {
          testCardUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
          testCardUID += String(mfrc522.uid.uidByte[i], HEX);
        }
        testCardUIDArea = cardUIDArea(testCardUID);
        //readCardUIDArea = testCardUIDArea;

        // send carId, sendRFIDX, sendRFIDY to server
        btserial.write(carId);
        sendRFIDX = testCardUIDArea[0];
        sendRFIDY = testCardUIDArea[1];
        btserial.write(sendRFIDX);
        btserial.write(sendRFIDY);
        sendComeBackSwitch = false;
      }

      //**********BT received startOff message ('m' or 'M')************
      // server依移動順序不同，在不同時間傳送'm'，收到'm'的車就進入歸位模式
    } else if (rec == 'm') {
      // switch to statue 2
      carMoving = false;
      delay(1000);
      statue = 2;
      // 收到'M'的車進入出動模式
    } else if (rec == 'M') {
      Serial.println("received M");
      // check startOff Point, if on start point, switch to statue 3
      if ( ! mfrc522.PICC_IsNewCardPresent() || ! mfrc522.PICC_ReadCardSerial() ) {
        delay(50);
        Serial.println("no card");
      } else {
        String testCardUID = "";
        for (byte i = 0; i < mfrc522.uid.size; i++) {
          testCardUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
          testCardUID += String(mfrc522.uid.uidByte[i], HEX);
        }
        String testCardUIDArea2 = cardUIDArea(testCardUID);
        if (testCardUIDArea2 == "02") {
          currentParking = '1';
          delay(1000);
          statue = 3;
        } else if (testCardUIDArea2 == "52") {
          currentParking = '2';
          delay(1000);
          statue = 3;
        } else if (testCardUIDArea2 == "01") {
          currentParking = '3';
          delay(1000);
          statue = 3;
        } else if (testCardUIDArea2 == "51") {
          currentParking = '4';
          delay(1000);
          statue = 3;
        } else if (testCardUIDArea2 == "00") {
          currentParking = '5';
          delay(1000);
          statue = 3;
        } else if (testCardUIDArea2 == "50") {
          currentParking = '6';
          delay(1000);
          statue = 3;
        } else {
          Serial.println("wrong card");
          delay(50);
        }
      }
    // server會傳來車子應該去的停車位編號
    } else if (rec == '1') {
      parkingTarget = '1';
    } else if (rec == '2') {
      parkingTarget = '2';
    } else if (rec == '3') {
      parkingTarget = '3';
    } else if (rec == '4') {
      parkingTarget = '4';
    } else if (rec == '5') {
      parkingTarget = '5';
    } else if (rec == '6') {
      parkingTarget = '6';
    // asd分別代表情境123，將目前所在位置讀取到的卡片編號存入情境變數中，等進入出動模式時要再拿出來用
    } else if (rec == 'a') {
      readCardUIDArea = testCardUIDArea;
      context1 = readCardUIDArea;
    } else if (rec == 's') {
      readCardUIDArea = testCardUIDArea;
      context2 = readCardUIDArea;
    } else if (rec == 'd') {
      readCardUIDArea = testCardUIDArea;
      context3 = readCardUIDArea;
    // 查詢已儲存的情境變數，看看車要移動的目標位置是什麼
    } else if (rec == 'q') {
      savedCardUIDArea = context1;
    } else if (rec == 'w') {
      savedCardUIDArea = context2;
    } else if (rec == 'e') {
      savedCardUIDArea = context3;
    }
  }
  //-------------------------------------------------
}

void initial() {
  if ( ! mfrc522.PICC_IsNewCardPresent() || ! mfrc522.PICC_ReadCardSerial() ) {
    delay(50);
    return;
  }
  pause(0);
}

void startOff(String card, char parking) {
  if ( ! mfrc522.PICC_IsNewCardPresent() || ! mfrc522.PICC_ReadCardSerial() ) {
    delay(50);
    if (parking == '2' || parking == '4' || parking == '6') {
      goForward(0);
    } else if (parking == '1' || parking == '3' || parking == '5') {
      goBackward(0);
    }
  } else {
    cardUID = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      cardUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      cardUID += String(mfrc522.uid.uidByte[i], HEX);
    }
    Serial.println("cardUID = " + cardUID);
    String area = cardUIDArea(cardUID);

    // 當車在不同停車位時，移動到桌面上的路徑
    switch (parking) {
      case '1':
        // 停車位1
        if (area == "02") {
          goBackward(0);
        } else if (card.substring(1) == "2") {
          if (area == card) {
            statue = 1;
          }
        } else if (card.substring(1) == "1" || card.substring(1) == "0") {
          String turnPoint = card.substring(0, 1) + '2';
          if (area == turnPoint) {
            pause(1000);
            turnRight();
            pause(1000);
            goBackward(500);
          } else if (area == card) {
            turnLeft();
            statue = 1;
          }
        }
        break;
      case '2':
        // 停車位2
        if (area == "52") {
          goForward(0);
        } else if (card.substring(1) == "2") {
          if (area == card) {
            statue = 1;
          }
        } else if (card.substring(1) == "1" || card.substring(1) == "0") {
          String turnPoint = card.substring(0, 1) + '2';
          if (area == turnPoint) {
            pause(1000);
            turnLeft();
            pause(1000);
            goForward(500);
          } else if (area == card) {
            turnRight();
            statue = 1;
          }
        }
        break;
      case '3':
        // 停車位3
        if (area == "01") {
          goBackward(0);
        } else if (card.substring(1) == "1") {
          if (area == card) {
            statue = 1;
          }
        } else if (card.substring(1) == "2") {
          String turnPoint = card.substring(0, 1) + '1';
          if (area == turnPoint) {
            pause(1000);
            turnLeft();
            pause(1000);
            goBackward(500);
          } else if (area == card) {
            turnRight();
            statue = 1;
          }
        } else if (card.substring(1) == "0") {
          String turnPoint = card.substring(0, 1) + '1';
          if (area == turnPoint) {
            pause(1000);
            turnRight();
            pause(1000);
            goBackward(500);
          } else if (area == card) {
            turnLeft();
            statue = 1;
          }
        }
        break;
      case '4':
        // 停車位4
        if (area == "51") {
          goForward(0);
        } else if (card.substring(1) == "1") {
          if (area == card) {
            statue = 1;
          }
        } else if (card.substring(1) == "2") {
          String turnPoint = card.substring(0, 1) + '1';
          if (area == turnPoint) {
            pause(1000);
            turnRight();
            pause(1000);
            goForward(500);
          } else if (area == card) {
            turnLeft();
            statue = 1;
          }
        } else if (card.substring(1) == "0") {
          String turnPoint = card.substring(0, 1) + '1';
          if (area == turnPoint) {
            pause(1000);
            turnLeft();
            pause(1000);
            goForward(500);
          } else if (area == card) {
            turnRight();
            statue = 1;
          }
        }
        break;
      case '5':
        // 停車位5
        if (area == "00") {
          goBackward(0);
        } else if (card.substring(1) == "0") {
          if (area == card) {
            statue = 1;
          }
        } else if (card.substring(1) == "1" || card.substring(1) == "2") {
          String turnPoint = card.substring(0, 1) + '0';
          if (area == turnPoint) {
            pause(1000);
            turnLeft();
            pause(1000);
            goBackward(500);
          } else if (area == card) {
            turnRight();
            statue = 1;
          }
        }
        break;
      case '6':
        // 停車位6
        if (area == "50") {
          goForward(0);
        } else if (card.substring(1) == "0") {
          if (area == card) {
            statue = 1;
          }
        } else if (card.substring(1) == "1" || card.substring(1) == "2") {
          String turnPoint = card.substring(0, 1) + '0';
          if (area == turnPoint) {
            pause(1000);
            turnRight();
            pause(1000);
            goForward(500);
          } else if (area == card) {
            turnLeft();
            statue = 1;
          }
        }
        break;
    }

  }
}

void comeBack(String card, char parking) {
  if (card.substring(0, 1) == "0" || card.substring(0, 1) == "5") {
    statue = 1;
  } else {
    if ( ! mfrc522.PICC_IsNewCardPresent() || ! mfrc522.PICC_ReadCardSerial() ) {
      delay(50);
      if (parking == '2' || parking == '4' || parking == '6') {
        goBackward(0);
      } else if (parking == '1' || parking == '3' || parking == '5') {
        goForward(0);
      }
    } else {
      cardUID = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        cardUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        cardUID += String(mfrc522.uid.uidByte[i], HEX);
      }
      Serial.println("cardUID = " + cardUID);
      String area = cardUIDArea(cardUID);

      // 當車要前往不同停車位時，移動到各個停車位的路徑
      switch (parking) {
        case '1':
          // 停車位1
          if (area == "02") {
            statue = 1;
          } else if (card.substring(1) == "2") {
            if (area == card) {
              goForward(0);
            }
          } else if (card.substring(1) == "1" || card.substring(1) == "0") {
            String turnPoint = card.substring(0, 1) + "2";
            if (area == card) {
              turnRight();
              pause(1000);
              goForward(500);
            } else if (area == turnPoint) {
              pause(1000);
              turnLeft();
              pause(1000);
              goForward(500);
            }
          }
          break;
        case '2':
          // 停車位2
          if (area == "52") {
            statue = 1;
          } else if (card.substring(1) == "2") {
            if (area == card) {
              goBackward(0);
            }
          } else if (card.substring(1) == "1" || card.substring(1) == "0") {
            String turnPoint = card.substring(0, 1) + '2';
            if (area == card) {
              turnLeft();
              pause(1000);
              goBackward(500);
            } else if (area == turnPoint) {
              pause(1000);
              turnRight();
              pause(1000);
              goBackward(500);
            }
          }
          break;
        case '3':
          // 停車位3
          if (area == "01") {
            statue = 1;
          } else if (card.substring(1) == "1") {
            if (area == card) {
              goForward(0);
            }
          } else if (card.substring(1) == "2") {
            String turnPoint = card.substring(0, 1) + '1';
            if (area == card) {
              turnLeft();
              pause(1000);
              goForward(500);
            } else if (area == turnPoint) {
              pause(1000);
              turnRight();
              pause(1000);
              goForward(500);
            }
          } else if (card.substring(1) == "0") {
            String turnPoint = card.substring(0, 1) + '1';
            if (area == card) {
              turnRight();
              pause(1000);
              goForward(500);
            } else if (area == turnPoint) {
              pause(1000);
              turnLeft();
              pause(1000);
              goForward(500);
            }
          }
          break;
        case '4':
          // 停車位4
          if (area == "51") {
            statue = 1;
          } else if (card.substring(1) == "1") {
            if (area == card) {
              goBackward(0);
            }
          } else if (card.substring(1) == "2") {
            String turnPoint = card.substring(0, 1) + '1';
            if (area == card) {
              turnRight();
              pause(1000);
              goBackward(500);
            } else if (area == turnPoint) {
              pause(1000);
              turnLeft();
              pause(1000);
              goBackward(500);
            }
          } else if (card.substring(1) == "0") {
            String turnPoint = card.substring(0, 1) + '1';
            if (area == card) {
              turnLeft();
              pause(1000);
              goBackward(500);
            } else if (area == turnPoint) {
              pause(1000);
              turnRight();
              pause(1000);
              goBackward(500);
            }
          }
          break;
        case '5':
          // 停車位5
          if (area == "00") {
            statue = 1;
          } else if (card.substring(1) == "0") {
            if (area == card) {
              goForward(0);
            }
          } else if (card.substring(1) == "2" || card.substring(1) == "1") {
            String turnPoint = card.substring(0, 1) + '0';
            if (area == card) {
              turnLeft();
              pause(1000);
              goForward(500);
            } else if (area == turnPoint) {
              pause(1000);
              turnRight();
              pause(1000);
              goForward(500);
            }
          }
          break;
        case '6':
          // 停車位6
          if (area == "50") {
            statue = 1;
          } else if (card.substring(1) == "0") {
            if (area == card) {
              goBackward(0);
            }
          } else if (card.substring(1) == "2" || card.substring(1) == "1") {
            String turnPoint = card.substring(0, 1) + '0';
            if (area == card) {
              turnRight();
              pause(1000);
              goBackward(0);
            } else if (area == turnPoint) {
              pause(1000);
              turnLeft();
              pause(1000);
              goBackward(500);
            }
          }
          break;
      }

    }
  }
}

String cardUIDArea(String readCard) {
  if (readCard == "b0819c02" || readCard == "b087a402" || readCard == "b4e8caa5" || readCard == "0210f8fd" || readCard == "a542bc04" || readCard == "c3c50ab9" || readCard == "a5c6ab04") {
    return "52";
  } else if (readCard == "14e014db" || readCard == "206514db" || readCard == "36c914db" || readCard == "c232aca9" || readCard == "e510b108" || readCard == "25c9c604" || readCard == "0597a204") {
    return "51";
  } else if (readCard == "32a1333b" || readCard == "7c233a3b" || readCard == "b9e0c4a5" || readCard == "7db4dfd5" || readCard == "a0d88c02" || readCard == "75540304" || readCard == "d4543d51") {
    return "50";
  } else if (readCard == "954ea608" || readCard == "d5dfa104" || readCard == "15dda104" || readCard == "59ee112b" || readCard == "a3c10fb9" || readCard == "b511a604" || readCard == "a9c7cce6") {
    return "02";
  } else if (readCard == "3562a904" || readCard == "f5ad7d04" || readCard == "b0036902" || readCard == "6235d4fd" || readCard == "a57ba104" || readCard == "b07ae702" || readCard == "55680d09") {
    return "01";
  } else if (readCard == "7330b400" || readCard == "92bba401" || readCard == "84fe2d63" || readCard == "1954eed5" || readCard == "f57db708" || readCard == "b567bb04" || readCard == "9586c908") {
    return "00";
  } else if (readCard == "e5eba608" || readCard == "3341017b" || readCard == "24f3383b" || readCard == "59063a3b" || readCard == "b6bd232b" || readCard == "d247eed5" || readCard == "37a5232b") {
    return "10";
  } else if (readCard == "25f4b708" || readCard == "4506c908" || readCard == "a5e4a204" || readCard == "85620309" || readCard == "9595fe03" || readCard == "85137d04" || readCard == "d547a004") {
    return "11";
  } else if (readCard == "3516a308" || readCard == "25487a04" || readCard == "e5a8fd03" || readCard == "b584b808" || readCard == "c5eea908" || readCard == "656ea704" || readCard == "f51cc204") {
    return "12";
  } else if (readCard == "e577bd08" || readCard == "d0049001" || readCard == "01e7232b" || readCard == "d51abf04" || readCard == "6576c204" || readCard == "1315eed5" || readCard == "a2ce323b") {
    return "20";
  } else if (readCard == "15d27304" || readCard == "935578e3" || readCard == "75abba04" || readCard == "fe21f675" || readCard == "d904c9e6" || readCard == "0592a304" || readCard == "a3160bb9") {
    return "21";
  } else if (readCard == "3425cca5" || readCard == "0517bc04" || readCard == "85ce9e04" || readCard == "8567232b" || readCard == "8e7ccba5" || readCard == "655dc004" || readCard == "85fa9804") {
    return "22";
  } else if (readCard == "b038b102" || readCard == "9a3cebd5" || readCard == "23080eb9" || readCard == "91e4232b" || readCard == "54b33351" || readCard == "aecfecd5" || readCard == "65a3232b") {
    return "30";
  } else if (readCard == "a51cc704" || readCard == "234224ba" || readCard == "f54ac504" || readCard == "82dd6401" || readCard == "952ca804" || readCard == "f37908b9" || readCard == "f5fcff03") {
    return "31";
  } else if (readCard == "d5b3c808" || readCard == "c5071004" || readCard == "65b3bb08" || readCard == "a5bd007b" || readCard == "15ccc404" || readCard == "25f5bc08" || readCard == "b539ba08") {
    return "32";
  } else if (readCard == "74d03d51" || readCard == "fcdb232b" || readCard == "ea9a313b" || readCard == "11ec007b" || readCard == "e4d71751" || readCard == "5284ecd5" || readCard == "93ecf675") {
    return "40";
  } else if (readCard == "9591c404" || readCard == "2517c404" || readCard == "1507bf04" || readCard == "d59bc604" || readCard == "45c67404" || readCard == "2576fd03" || readCard == "d5b1a504") {
    return "41";
  } else if (readCard == "a5847304" || readCard == "f5f3c908" || readCard == "a5cac204" || readCard == "2526bb04" || readCard == "65ca0b04" || readCard == "e97af4e6" || readCard == "d25586a9") {
    return "42";
  }
}


void left()
{
  if (carMoving) {
    analogWrite(AIA, 0);
    analogWrite(AIB, speed);
    analogWrite(BIA, 0);
    analogWrite(BIB, 230);
  }
}

void right()
{
  if (carMoving) {
    analogWrite(AIA, speed);
    analogWrite(AIB, 0);
    analogWrite(BIA, 230);
    analogWrite(BIB, 0);
  }
}

void forward()
{
  if (carMoving) {
    analogWrite(AIA, speed);
    analogWrite(AIB, 0);
    analogWrite(BIA, 0);
    analogWrite(BIB, 230);
  }
}

void backward()
{
  if (carMoving) {
    analogWrite(AIA, 0);
    analogWrite(AIB, speed);
    analogWrite(BIA, 230);
    analogWrite(BIB, 0);
  }
}

void stopCar()
{
  if (!carMoving) {
    analogWrite(AIA, 0);
    analogWrite(AIB, 0);
    analogWrite(BIA, 0);
    analogWrite(BIB, 0);
  }
}

void goForward(int sec) {
  carMoving = true;
  forward();
  delay(sec);
}

void goBackward(int sec) {
  carMoving = true;
  backward();
  delay(sec);
}

void turnRight() {
  carMoving = true;
  right();
  delay(500);
}

void turnLeft() {
  carMoving = true;
  left();
  delay(500);
}

void pause(int sec) {
  carMoving = false;
  stopCar();
  delay(sec);
}
