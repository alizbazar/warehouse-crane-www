/*global define, console*/

/**
 * App module
 */

define({
    name: 'app',
    requires: [
        'core/event',
        'core/application',
        'views/initPage'
    ],
    def: function appInit(req) {
        'use strict';

        console.log('app::def');

        var e = req.core.event,
            app = req.core.application,
            OPERATION_ALARM = 'http://tizen.org/appcontrol/operation/alarm';

        function init() {
            var appOperation = app.getCurrentApplication()
                .getRequestedAppControl()
                .appControl
                .operation;

            if (appOperation.indexOf(OPERATION_ALARM) !== -1) {
                e.fire('timeAlarm', {
                    time: appOperation.substr(OPERATION_ALARM.length + 1)
                });
            }
            console.log('app::init');
        }

        e.listeners({
            'core.storage.idb.open': init
        });

        return {
            //init: init
        };
    }
});

function getNextTask(callback) {
    // GET NEXT ITEM
    // CACHE it's data
    console.log('start');
    var a = Math.random();
    if (a > 0.5) {
        switchView('incoming-start');
    } else {
        switchView('outgoing-start');
    }
}

// Relevant divs:
// incoming-start incoming-select incoming-transfer incoming-more outgoing-start outgoing-map outgoing-transfer
// .task-content, .task-actions
function switchView(view) {
    $('.task-content, .task-actions').not('.' + view).toggleClass('hidden', true);
    $('.task-content.' + view + ', .task-actions.' + view).toggleClass('hidden', false);
}

$('.ui-page').on('click', '.ui-btn', function(e) {
    var $btn = $(this);
    var context = $btn.closest('footer').data('context');
    console.log('context:' + context);

    if (context == 'incoming-start') {
        switchView('incoming-select');
        // Switch .task-content text with item name when in proximity
        // toggle disabled state of the button
        setTimeout(function() { $('.task-actions.incoming-select .ui-btn').removeAttr('disabled') }, 1000);

    } else if (context == 'incoming-select') {
        // TODO: select item, send to server
        switchView('incoming-transfer');


    } else if (context == 'incoming-transfer') {
        // TODO: get crane location, save location to item data 
        switchView('incoming-more');
    } else if (context == 'incoming-more') {
        // TODO: identify yes / no
        if ($btn.hasClass('confirm-btn')) {
            console.log('yes');
            switchView('incoming-start');
        } else {
            // TODO: no => mark task complete && getNextItem
            getNextTask();
        }
    } else if (context == 'outgoing-start') {
        // TODO: set task status to STARTED && get own location & crane location, draw crane, item & me on the map && display item identifier
        switchView('outgoing-map');
    } else if (context == 'outgoing-map') {
        // TODO: change item status as to LEAVING_STORAGE
        switchView('outgoing-transfer');
    } else if (context == 'outgoing-transfer') {
        // TODO: remove item from storage && getNextItem
        getNextTask();
    }
});

