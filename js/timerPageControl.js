/*global tizen, console, document*/
var OPERATION_ALARM = 'http://tizen.org/appcontrol/operation/alarm';

try {
    var appOperation = tizen
        .application
        .getCurrentApplication()
        .getRequestedAppControl()
        .appControl
        .operation;

    if (appOperation.indexOf(OPERATION_ALARM) !== -1) {
        var mask = document.createElement('div');
        mask.setAttribute('id', 'mask-page');
        document.body.insertBefore(mask, document.body.childNodes[0]);
    }
} catch (e) {
    console.error('Error: ', e.message);
}