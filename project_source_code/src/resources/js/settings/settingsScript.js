document.addEventListener('DOMContentLoaded', () => {

    /* When the user clicks on the button, 
    toggle between hiding and showing the dropdown content */
    drop_buttons = document.getElementsByClassName('dropdown-button')
    for (var i = 0; i < drop_buttons.length; i++) {
        var id = drop_buttons[i].id;
        drop_buttons[i].addEventListener('click', myFunction.bind(this, id), false);
    }

    apperance_form = document.getElementById('apperanceForm');

    apperance_form.addEventListener('change', function () {
        mode_select = document.getElementById('mode_select');
        mode = mode_select.value;
        id;
        switch (mode) {
            case 'light':
                id = 0;
                break;
            case 'dark':
                id = 1;
                break;
            default:
                console.log('error');
        }

    }, false)

    function myFunction(id) {
        document.getElementById(id + 'Dropdown').classList.toggle("show");
        /*Javascript for displaying current settings*/
        // if (id == 'privacy') {
        //     checkbox = document.getElementById('public_friends_checkbox')
        //     checkbox.checked = JSON.parse('{{{settings.public_friends}}}');
        // }
        // else if (id == 'notif') {
        //     checkbox = document.getElementById('message_notif_checkbox')
        //     checkbox.checked = JSON.parse('{{{settings.message_notifs}}}');
        //     checkbox = document.getElementById('match_notif_checkbox')
        //     checkbox.checked = JSON.parse('{{{settings.match_notifs}}}');
        // }
        // else if (id == 'apperance') {

        //     mode_select = document.getElementById('mode_select');
        //     mode_select.value = ('{{settings.apperance_mode}}');
        // }
    }
});