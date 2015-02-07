// Beacon code here

function sb() {
	try {
		var adapter = tizen.bluetooth.getDefaultAdapter();
		console.log(adapter);
	} catch (err) {
		console.log (err.name +": " + err.message);
	}

	this.adapter = tizen.bluetooth.getDefaultAdapter();
	/* Enable Bluetooth */
	adapter.setPowered(true, function() 
	{
	   console.log("Bluetooth powered on successfully.");
	});
	
	var discoverDevicesSuccessCallback = 
	{
	   /* When a device is found */
	   ondevicefound: function(device)
	   {
	      console.log("Found device - name: " + device.name);
	   }
	}
	
	console.log(discoverDevicesSuccessCallback);
	/* Discover devices */
	adapter.discoverDevices(discoverDevicesSuccessCallback, null);

	/* When a known device is found */
	function onGotDevices(devices) 
	{
	   console.log("The number of known devices: " + devices.length);
	}

	/* Retrieve known devices */
	adapter.getKnownDevices(onGotDevices, onError);

}

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