# TARDIS - the app!

## Overview

This project began life several years ago when my sone gave me a 3D-printed TARDIS and some LEDs.

Not content with just lighting up a bunch of LEDs "it works fine if you just hook them up in series dad, the voltage drop across the LEDs is enough to power them all..."

Instead, I wanted them to be able to be individually powered up.  I've a had a couple of microcontrollers for years (Basic Stamp and a Teensy USB), but I quickly realized that just being able to light the LEDs up in sequence is no longer enough.  I want them to REACT to things.

I also have a couple of OrangePI PCs, so I thought about running something from those.  The attractivness of the OrangePI approach is the fact that these Rasberry PI clones have a significant amount of computation power.  However, the space available was not particularly conducive to such a large board.  In addition, the power requirements and heat generation are less than desirable.  Putting the computer outside the Tardis enclosure (sorry Dr. Who fans, my Tardis is not actually bigger on the inside...) meant I would have to run at least 6 wires to have individual control of the LEDs; this would lead to un unsightly mess of wires.

I decided that I wanted something that could be very portable and possibly run on batteries.

Enter the ESP32.  At around that time, I discovered the ESP series from Espressif, but I had a really hard time justifying spending much on something that is objectively little more than a toy.

However, the NodeMCU dev boards based on either the ESP8266 or ESP32 are pretty powerful.  Then I stumbled across MongooseOS, and I realized that I had the complete package I needed.  Mongoose provides a powerful library of IOT features including shadow support, OTA updates, and for a hobbyist, the price is fantastic.  Free for the OS (with the simple restriction that the "Free" OS does not allow OTA updates except via their dashboard), and free for the dashboard, up to 10 devices.  mDash fully supports OTA configuration edits, OTA updates, shadow, and even provide database accessibility.  Mongoose itself provides support for AWS, Google, Azure, Samsung, their own mDash, basically, a complete package, and so, the Tardis project was born.
