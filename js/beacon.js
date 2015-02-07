var pos = {
		bridge: 1000, 
		hoist: 500, 
		trolley: 1000,
		x: 1000,
		y: 1000,
		z: 1000
};

mx = [];
my = [];
mz = [];

function sortNumber(a,b) {
    return a - b;
}

function countMedian() {
	mx = [];
	my = [];
	mz = [];
	getCranePosition_TEST(recursiveMedianCount);
}

function recursiveMedianCount(pos) {
	//console.log(pos.x+" "+pos.y+" "+pos.z);
	if (mx.length > 10) {
		
		mx.sort(sortNumber);
		my.sort(sortNumber);
		mz.sort(sortNumber);
		for (var i = 0; i < 11; i++) {
			console.log(mx[i]+" "+my[i]+" "+mz[i]);
		}
		var x = mx[5];
		var y = my[5];
		var z = mz[5];
		medianReady(x,y,z);
	} else {
		mx.push(parseInt(pos.x));
		my.push(parseInt(pos.y));
		mz.push(parseInt(pos.z));
		getCranePosition_TEST(recursiveMedianCount);
	}
}

function medianReady(x,y,z) {
	console.log("ZÖ MEDIANS ARE READY!");
	console.log(x+" "+y+" "+z);

}

function getCranePosition_TEST(recursiveMedianCount) {
	recursiveMedianCount({
		bridge: Math.floor((Math.random() * 100) + 1), 
		hoist: Math.floor((Math.random() * 100) + 1), 
		trolley: Math.floor((Math.random() * 100) + 1),
		x: Math.floor((Math.random() * 100) + 1),
		y: Math.floor((Math.random() * 100) + 1),
		z: Math.floor((Math.random() * 100) + 1)
	});
}
