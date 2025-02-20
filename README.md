# ESP Web Tool
A web app to flash Binary your ESP32 or ESP8266 through your browser. Open-Source, free, and easy to use.

This project is inspired by [serial.huhn.me](https://esp.huhn.me)

## Corresponding software
Based on [ESP Web Flasher](https://github.com/NabuCasa/esp-web-flasher)  
And inspired by [esptool-js](https://github.com/espressif/esptool-js).

## Installation

```sh
git clone https://github.com/nhoc20170861/iot-driver.git
cd iot-driver
npm install
npm run
```
## Backend
This project includes a **NodeJS-Express** server to manage binaries, users just need to select the desired binary versions. 
Then connect to the target board and select flash to load the program.
### Techniques
Binary files will be stored on **firebase storage** and metada files corresponding to each file will be stored on **firestore databases**

## License 

This software is licensed under the MIT License. See the [license file](LICENSE) for details.  
