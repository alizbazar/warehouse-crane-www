// Beacon code here

var w8JQ = {
    name: "w8JQ",
    uuid: "f7826da6-4fa2-4e98-8024-bc5b71e0893e",
    major: 47568,
    minor: 31112
};

var WKRn = {
    name: "WKRn",
    uuid: "f7826da6-4fa2-4e98-8024-bc5b71e0893e",
    major: 59039,
    minor: 17164
}

var adapter = tizen.bluetooth.getDefaultAdapter();
// Holds currently registered service record
var chatServiceHandler = null;
// Holds currently open socket
var serviceSocket = null;

function chatServiceSuccessCb(recordHandler) {
   console.log("Chat service registration succeeds!");
   chatServiceHandler = recordHandler;
   recordHandler.onconnect = function(socket) {
       console.log("Client connected: " + socket.peer.name + "," + socket.peer.address);
       serviceSocket = socket;
       // Messages received from remote device
       socket.onmessage = function() {
            var data = socket.readData();
            // Handles message code goes here

       };

       socket.onclose = function() {
           console.log('The socket is closed.');
           serviceSocket = null;
       };
   };
};

function publishChatService() {
   var CHAT_SERVICE_UUID = "f7826da6-4fa2-4e98-8024-bc5b71e0893e";
   console.log("1");
   adapter.registerRFCOMMServiceByUUID(CHAT_SERVICE_UUID, "Chat service", function(recordHandler) {
	   console.log("Chat service registration succeeds!");
	   chatServiceHandler = recordHandler;
	   recordHandler.onconnect = function(socket) {
	       console.log("Client connected: " + socket.peer.name + "," + socket.peer.address);
	       serviceSocket = socket;
	       // Messages received from remote device
	       socket.onmessage = function() {
	            var data = socket.readData();
	            // Handles message code goes here

	       };

	       socket.onclose = function() {
	           console.log('The socket is closed.');
	           serviceSocket = null;
	       };
	   }
   });
	    
   /*,
     // Error handler
     function(e) {
          console.log( "Could not register service record, Error: " + e.message);
     });*/
   console.log("2");
}

function unregisterChatService() {
     if (chatServiceHandler != null) {
         chatServiceHandler.unregister(function() {
              console.log("Chat service is unregistered");
              chatServiceHandler = null;
          }, function(e) {
              console.log("Failed to unregister service: " + e.message);
          });
     }
}
publishChatService();
/*
var adapter = tizen.bluetooth.getDefaultAdapter();
adapter.connectToServiceByUUID("f7826da6-4fa2-4e98-8024-bc5b71e0893e", function(a) {
	console.log(a);
});
console.log("bb");


function startDiscovery() {
	console.log("START DISCOVERY A");
    discoverDevicesSuccessCallback = {
        onstarted: function() {
            console.log("Device discovery started...");
        },
        ondevicefound: function(device) {
            console.log("Found device - name: " + device.name + ", Address: " + device.address);
        },
        ondevicedisappeared: function(address) {
            console.log("Device disappeared: " + address);
        },
        onfinished: function(devices) {
            console.log("Found Devices");
            for (var i = 0; i < devices.length; i++) {
                console.log("Name: " + devices[i].name + ", Address: " + devices[i].address);
            }
            console.log("Total: " + devices.length);
        }
    };
    console.log("START DISCOVERY B");
    // Starts searching for nearby devices, for about 12 sec.
    
    adapter.discoverDevices(discoverDevicesSuccessCallback, function(e) {
        console.log("Failed to search devices: " + e.message + "(" + e.name + ")");
    });
    
    adapter.discoverDevices(function(value) {
    	console.log(value);
    }, null);
    console.log("START DISCOVERY C");
}

function onSetPoweredError(e) {
    console.log("Could not turn on device, reason: " + e.message + "(" + e.name + ")");
}
console.log("1");
adapter.setPowered(true, startDiscovery, onSetPoweredError);
console.log("2");
*/
/*

function sb() {
	try {
		var adapter = tizen.bluetooth.getDefaultAdapter();
		console.log(adapter);
	} catch (err) {
		console.log (err.name +": " + err.message);
	}

	this.adapter = tizen.bluetooth.getDefaultAdapter();
	// Enable Bluetooth 
	adapter.setPowered(true, function() 
	{
	   console.log("Bluetooth powered on successfully.");
	});
	
	var discoverDevicesSuccessCallback = 
	{
	   // When a device is found 
	   ondevicefound: function(device)
	   {
	      console.log("Found device - name: " + device.name);
	   }
	}
	
	console.log(discoverDevicesSuccessCallback);
	// Discover devices 
	adapter.discoverDevices(discoverDevicesSuccessCallback, null);

	// When a known device is found 
	function onGotDevices(devices) 
	{
	   console.log("The number of known devices: " + devices.length);
	}

	// Retrieve known devices
	adapter.getKnownDevices(onGotDevices, onError);

}
*/
/*


this.model.registerServer(this.adapter, this.serviceUUID, this.registerServerSuccess.bind(this));
device.connectToServiceByUUID(serviceUUID, successCallback, errorCallback, 'RFCOMM');


connectToService: function ClientModel_connectToService(device, serviceUUID, 
        successCallback, errorCallback) 
{
this.client.chatServerDevice = device;
try 
{
device.connectToServiceByUUID(serviceUUID, successCallback, errorCallback, 'RFCOMM');
}
*/