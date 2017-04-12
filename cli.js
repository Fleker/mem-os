$ = function(param) {
    if (param.charAt(0) == "#") {
        return document.querySelector(param);
    }
    return document.querySelectorAll(param);
}

function cli_handler() {
    // TODO Handle cases where one 'word' has spaces in quotes
    var cmd = $('#entry').value.toLowerCase();
    var args = cmd.split(' ');
    cli_history_append(cmd);
    process_add("Terminal", cli_process, args);
    $('#entry').value = ''; // Clear input
}

function cli_history_append(cmd) {
    $('#history').innerHTML += cmd + "<br>";
    $('#history').scrollTop = $('#history').scrollHeight; // Force to bottom
}

function cli_process(args) {
    cli_history_append(cli_parse(args.join(' '), args));
    process_remove_self();
}

function cli_parse(cmd, args) {
    if (args[0] == "hello") {
        return 'Hello.';
    }
    if (cli_commands[args[0]]) {
        return cli_commands[args[0]](args);
    }
    return 'Command not recognized';
}

var cli_commands = {};
function cli_register(cmd, fnc) {
    if (!cli_commands[cmd]) {
        cli_commands[cmd] = fnc;
    }
}

/* UI Stuff */
function show_tab(tab_id) {
    // Reset all styles
    $('#tab_0').style.display = 'none';
    $('#tab_1').style.display = 'none';
    $('#tab_2').style.display = 'none';
    $('#tab_3').style.display = 'none';
    $('#tab_label_0').classList.remove('active');
    $('#tab_label_1').classList.remove('active');
    $('#tab_label_2').classList.remove('active');
    $('#tab_label_3').classList.remove('active');

    $('#tab_' + tab_id).style.display = 'block';
    $('#tab_label_' + tab_id).classList.add('active');
}
