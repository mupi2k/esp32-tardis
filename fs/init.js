load('api_aws.js');
load('api_config.js');
load('api_dash.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_shadow.js');
load('api_timer.js');
load('api_sys.js');
load('api_pwm.js');

let btn = Cfg.get('board.btn1.pin');              // Built-in button GPIO
let ledT = Cfg.get('board.ledT.pin');               // LED for TOP
let ledA = Cfg.get('board.ledA.pin');
let ledB = Cfg.get('board.ledB.pin');
let ledC = Cfg.get('board.ledC.pin');
let ledD = Cfg.get('board.ledD.pin');

let onhiT = Cfg.get('board.ledT.active_high');     // LED on when high?
let onhiA = Cfg.get('board.ledA.active_high');     // LED on when high?
let onhiB = Cfg.get('board.ledB.active_high');     // LED on when high?
let onhiC = Cfg.get('board.ledC.active_high');     // LED on when high?
let onhiD = Cfg.get('board.ledD.active_high');     // LED on when high?

let AlertStack = [];
let state = {alert: "none", btnCount: 0, uptime: 0, "stack": AlertStack};  // Device state
let online = false;                               // Connected to the cloud?

print('********** reached end of config load **********');

let setLED = function(led, state, onhi) {
  let level = onhi ? state : !state;
  GPIO.set_mode(led, GPIO.MODE_OUTPUT);
  GPIO.write(led, level);
};

let br_step = 1;
let br_dir = 1;

let breathe = function() {
  // print('breath: ', br_step, 'dir: ', br_dir)
  PWM.set(ledT, 60, br_step * 0.03 );
  if (br_step === 28) { br_dir = -1 };
  if (br_step === 1) { br_dir = 1};
  br_step = br_step + br_dir;
};


let ring_step = 0;
let ring_sub1 = 5;
let ring_sub2 = 0;
let spiral_step = 0;
let spiral_sub = 1;
let spiral_dir = 1;

let clockwise = function() {

  if (ring_step === 0) {
    // ledA is increasing, ledD is decreasing
    PWM.set(ledC, 50, 1);
    PWM.set(ledB, 50, 1);
    PWM.set(ledA, 50, --ring_sub1 * 0.20);
    PWM.set(ledD, 50, ring_sub2++ * 0.15);
  } else if (ring_step === 1) {
    // ledB is increasing, ledA is decreasing
    PWM.set(ledC, 50, 1);
    PWM.set(ledD, 50, 1);
    PWM.set(ledB, 50, --ring_sub2 * 0.20);
    PWM.set(ledA, 50, ring_sub1++ * 0.15);
  } else if (ring_step === 2) {
    // ledC is increasing, ledB is decreasing
    PWM.set(ledA, 50, 1);
    PWM.set(ledD, 50, 1);
    PWM.set(ledC, 50, --ring_sub1 * 0.20);
    PWM.set(ledB, 50, ring_sub2++ * 0.15);
  } else if (ring_step === 3) {
    // ledD is increasing, ledC is decreasing
    PWM.set(ledA, 50, 1);
    PWM.set(ledB, 50, 1);
    PWM.set(ledD, 50, --ring_sub2 * 0.20);
    PWM.set(ledC, 50, ring_sub1++ * 0.15);
  }
  if ( ( ring_sub1 <= 0 ) || (ring_sub1 >= 5) ) { print('step: ', ring_step++);}
  if ( ring_step >= 4 ) { ring_step = 0 };

};

let counterclockwise = function() {
  if (ring_step === 0) {
    // ledD is increasing, ledA is decreasing
    PWM.set(ledC, 50, 1);
    PWM.set(ledB, 50, 1);
    PWM.set(ledD, 50, --ring_sub1 * 0.20);
    PWM.set(ledA, 50, ring_sub2++ * 0.15);
  } else if (ring_step === 1) {
    // ledC is increasing, ledD is decreasing
    PWM.set(ledA, 50, 1);
    PWM.set(ledB, 50, 1);
    PWM.set(ledC, 50, --ring_sub2 * 0.20);
    PWM.set(ledD, 50, ring_sub1++ * 0.15);
  } else if (ring_step === 2) {
    // ledB is increasing, ledC is decreasing
    PWM.set(ledA, 50, 1);
    PWM.set(ledD, 50, 1);
    PWM.set(ledB, 50, --ring_sub1 * 0.20);
    PWM.set(ledC, 50, ring_sub2++ * 0.15);
  } else if (ring_step === 3) {
    // ledA is increasing, ledB is decreasing
    PWM.set(ledC, 50, 1);
    PWM.set(ledD, 50, 1);
    PWM.set(ledA, 50, --ring_sub2 * 0.20);
    PWM.set(ledB, 50, ring_sub1++ * 0.15);
  }
  if ( ( ring_sub1 <= 0 ) || (ring_sub1 >= 5) ) { print('step: ', ring_step++);}
  if ( ring_step >= 4 ) { ring_step = 0 };

};

let ring = Timer.set(1, 0, function() {print('ring init');}, null);

let breath = Timer.set(1, 0, function() {print('breath init');}, null);

let spiral_cw = function() {
  if (spiral_step <= 0 ) {PWM.set(ledA, 50, spiral_sub * 0.25); spiral_step++; }
  else if (spiral_step === 1 ) {PWM.set(ledB, 50, spiral_sub * 0.25); spiral_step++; }
  else if (spiral_step === 2 ) {PWM.set(ledC, 50, spiral_sub * 0.25); spiral_step++; }
  else if (spiral_step >= 3 ){
    PWM.set(ledD, 50, spiral_sub * 0.25);
    spiral_step = 0;
    spiral_sub = spiral_sub + spiral_dir;
    if (spiral_sub >= 4) { spiral_dir = -1 }
    else if (spiral_sub <= 0) { spiral_dir = 1 }
  }
};

let spiral_ccw = function() {
  if (spiral_step === 0) {PWM.set(ledD, 50, spiral_sub * 0.25); spiral_step++;}
  else if (spiral_step === 1) {PWM.set(ledC, 50, spiral_sub * 0.25); spiral_step++;}
  else if (spiral_step === 2) {PWM.set(ledB, 50, spiral_sub * 0.25); spiral_step++;}
  else {
    PWM.set(ledA, 50, spiral_sub * 0.25);
    spiral_step = 0;
    spiral_sub = spiral_sub + spiral_dir;
    if (spiral_sub >= 4) { spiral_dir = -1 }
    else if (spiral_sub <= 0) { spiral_dir = 1 }
  }
};

let setAlert = function(alert) {
  print('alert state is now: ', state.alert);
  // clear all alert statuses when setting a new alert state
  Timer.del(breath);
  Timer.del(ring);
  PWM.set(ledT, 0, br_step)
  GPIO.blink(ledT, 0, 0);
  GPIO.blink(ledA, 0, 0);
  GPIO.blink(ledB, 0, 0);
  GPIO.blink(ledC, 0, 0);
  GPIO.blink(ledD, 0, 0);
  setLED(ledT, false, onhiT);
  setLED(ledA, false, onhiA);
  setLED(ledB, false, onhiB);
  setLED(ledC, false, onhiC);
  setLED(ledD, false, onhiD);
  PWM.set(ledT, 0, 0);
  PWM.set(ledA, 0, 0);
  PWM.set(ledB, 0, 0);
  PWM.set(ledC, 0, 0);
  PWM.set(ledD, 0, 0);
  if (state.alert === "test") {
    print("Caugh test state!");
  } else if (state.alert === "blink_top") {
    GPIO.blink(ledT, 500, 500);
  } else if (state.alert === "blink_ring") {
    GPIO.blink(ledA, 500, 500);
    GPIO.blink(ledB, 500, 500);
    GPIO.blink(ledC, 500, 500);
    GPIO.blink(ledD, 500, 500);
  } else if (state.alert === "ring_cw") {
    ring = Timer.set(100, Timer.REPEAT, clockwise, null);
  } else if (state.alert === "ring_ccw") {
    ring = Timer.set(100, Timer.REPEAT, counterclockwise, null);
  } else if (state.alert === "ring_cw_fast") {
    ring = Timer.set(50, Timer.REPEAT, clockwise, null);
  } else if (state.alert === "ring_ccw_fast") {
    ring = Timer.set(50, Timer.REPEAT, counterclockwise, null);
  } else if (state.alert === "spiral_cw") {
    ring = Timer.set(200, Timer.REPEAT, spiral_cw, null);
  } else if (state.alert === "spiral_ccw") {
    ring = Timer.set(200, Timer.REPEAT, spiral_ccw, null);
  } else if (state.alert === "spiral_cw_fast") {
    ring = Timer.set(50, Timer.REPEAT, spiral_cw, null);
  } else if (state.alert === "spiral_ccw_fast") {
    ring = Timer.set(50, Timer.REPEAT, spiral_ccw, null);
  } else {
    breath = Timer.set(200, Timer.REPEAT, breathe, null)  ;
  }
};

setLED(ledA, state.ledA, onhiA);
setLED(ledB, state.ledB, onhiB);
setLED(ledC, state.ledC, onhiC);
setLED(ledD, state.ledD, onhiD);

let reportState = function() {
  Shadow.update(0, state);
};

// Update state every minute, and report to cloud if online
Timer.set(60000, Timer.REPEAT, function() {
  state.uptime = Sys.uptime();
  state.ram_free = Sys.free_ram();
  print('online:', online, JSON.stringify(state));
  if (online) reportState();
}, null);

// Set up Shadow handler to synchronise device state with the shadow state
Shadow.addHandler(function(event, obj) {
  if (event === 'UPDATE_DELTA') {
    print('GOT DELTA:', JSON.stringify(obj));
    for (let key in obj) {  // Iterate over all keys in delta
      if (key === 'on') {   // We know about the 'on' key. Handle it!
        state.on = obj.on;  // Synchronise the state
        setLED(ledT, state.on, onhiT);   // according to the delta
      } else if (key === 'top') {   // We know about the 'on' key. Handle it!
        state.top = obj.top;  // Synchronise the state
        setLED(ledT, state.top, onhiT);   // according to the delta
      } else if (key === 'ledA') {   // We know about the 'on' key. Handle it!
        state.ledA = obj.ledA;  // Synchronise the state
        setLED(ledA, state.ledA, onhiA);   // according to the delta
      } else if (key === 'ledB') {   // We know about the 'on' key. Handle it!
        state.ledB = obj.ledB;  // Synchronise the state
        setLED(ledB, state.ledB, onhiB);   // according to the delta
      } else if (key === 'ledC') {   // We know about the 'on' key. Handle it!
        state.ledC = obj.ledC;  // Synchronise the state
        setLED(ledC, state.ledC, onhiC);   // according to the delta
      } else if (key === 'ledD') {   // We know about the 'on' key. Handle it!
        state.ledD = obj.ledD;  // Synchronise the state
        setLED(ledD, state.ledD, onhiD);   // according to the delta
      } else if (key === 'alert') {
        state.alert = obj.alert;
        setAlert(obj.alert);
      } else if (key === 'reboot') {
        state.reboot = obj.reboot;      // Reboot button clicked: that
        Timer.set(750, 0, function() {  // incremented 'reboot' counter
          Sys.reboot(500);                 // Sync and schedule a reboot
        }, null);
      }
    }
    reportState();  // Report our new state, hopefully clearing delta
  }
});

if (btn >= 0) {
  let btnCount = 0;
  let btnPull, btnEdge;
  if (Cfg.get('board.btn1.pull_up') ? GPIO.PULL_UP : GPIO.PULL_DOWN) {
    btnPull = GPIO.PULL_UP;
    btnEdge = GPIO.INT_EDGE_NEG;
  } else {
    btnPull = GPIO.PULL_DOWN;
    btnEdge = GPIO.INT_EDGE_POS;
  }
  GPIO.set_button_handler(btn, btnPull, btnEdge, 20, function() {
    state.btnCount++;
    let message = JSON.stringify(state);
    let sendMQTT = true;
    if (Dash.isConnected()) {
      print('== Click!');
      // TODO: Maybe do something else?
      sendMQTT = false;
    }
    // AWS is handled as plain MQTT since it allows arbitrary topics.
    if (AWS.isConnected() || (MQTT.isConnected() && sendMQTT)) {
      let topic = 'devices/' + Cfg.get('device.id') + '/events';
      print('== Publishing to ' + topic + ':', message);
      MQTT.pub(topic, message, 0 /* QoS */);
    } else if (sendMQTT) {
      print('== Not connected!');
    }
  }, null);
}

Event.on(Event.CLOUD_CONNECTED, function() {
  online = true;
  Shadow.update(0, {ram_total: Sys.total_ram()});
  // I use ledT to show provisioning state, once I'm CLOUD_CONNECTED,
  //    I don't really need it for that anymore...
  setLED(ledT, state.top, onhiT);

}, null);

Event.on(Event.CLOUD_DISCONNECTED, function() {
  online = false;
}, null);
