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

// Relevant divs:
// incoming-start incoming-select incoming-transfer incoming-more outgoing-start outgoing-map outgoing-transfer
// .task-content, .task-actions
function switchView(view) {
    $('.task-content, .task-actions').not('.' + view).toggleClass('hidden', true);
    $('.task-content.' + view + ', .task-actions.' + view).toggleClass('hidden', false);
}

$('.ui-page').on('click', '.ui-btn', function(e) {
    var context = $(this).closest('footer').data('context');
    console.log('context:' + context);

    if (context == 'incoming-start') {
        switchView('incoming-select');
    } else if (context == 'incoming-select') {
        switchView('incoming-transfer');
    } else if (context == 'incoming-transfer') {
        switchView('incoming-more');
    } else if (context == 'incoming-more') {
        switchView('outgoing-start');
    } else if (context == 'outgoing-start') {
        switchView('outgoing-map');
    } else if (context == 'outgoing-map') {
        switchView('outgoing-transfer');
    }
});

