document.addEventListener('DOMContentLoaded', () => {
    /* When the user clicks on the button, 
    toggle between hiding and showing the dropdown content */
    drop_buttons = document.getElementsByClassName('dropbtn')
    for (var i = 0 ; i < drop_buttons.length; i++) {
    var id = drop_buttons[i].id;
    drop_buttons[i].addEventListener('click' , myFunction.bind(this, id), false ) ; 
    }

    apperance_form = document.getElementById('apperanceForm');
    
    apperance_form.addEventListener('change', function(){

    radio = document.getElementsByName('color')
    radio_selection = ''
    for(var i = 0; i < radio.length; i++) {
        if(radio[i].checked) {
        radio_selection = radio[i].value;
        }
    }
    ui_color_light = ''
    ui_color = ''
    ui_color_dark = ''

    switch(radio_selection) {
        case "Red":
        ui_color_light = 'rgb(206, 65, 65)';
        ui_color = 'rgb(206, 65, 65)';
        ui_color_dark = 'rgb(206, 65, 65)';
        break;
        case "Orange":
        ui_color_light = 'rgb(205, 126, 70)'
        ui_color = "rgb(205, 126, 70)"
        ui_color_dark = 'rgb(205, 126, 70)'
        break;
        case "Yellow":
        ui_color_light = 'rgb(237, 221, 93)'
        ui_color = 'rgb(237, 221, 93)'
        ui_color_dark = 'rgb(237, 221, 93)'
        break;
        case "Green":
        ui_color_light = 'rgb(4, 170, 109)'
        ui_color = 'rgb(4, 170, 109)'
        ui_color_dark = 'rgb(4, 170, 109)'
        break;
        case "Blue":
        ui_color_light = 'rgb(56, 86, 183)'
        ui_color = 'rgb(56, 86, 183)'
        ui_color_dark = 'rgb(56, 86, 183)'
        break;
        case "Purple":
        ui_color_light = 'rgb(170, 52, 177)'
        ui_color = 'rgb(170, 52, 177)'
        ui_color_dark = 'rgb(170, 52, 177)'
        break;
        default:
        console.log('error');
    }
    ui = document.getElementsByClassName('dropdown-button')
    for(var i = 0; i < ui.length; i++) {
        ui[i].style.backgroundColor = ui_color;
    }
    }, false)

    function myFunction(id){
        
        document.getElementById(id+'Dropdown').classList.toggle("show");
        /*Javascript for displaying current settings*/
        if(id == 'accountDropdown') {

        }
        else if(id == 'notifDropdown') {
        
        }
        else if(id == 'chatDropdown') {

        }
        else if(id == 'apperanceDropdown') {

        color_select = document.getElementById('color{{settings.ui_color}}')
        color_select.checked = true;
    
        mode_select = document.getElementById('mode_select');
        mode_select.value = ('{{settings.apperance_mode}}');

        }
    } 
});