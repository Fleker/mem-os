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
    cli_history_append(cli_process(cmd, args));
    $('#entry').value = ''; // Clear input
}

function cli_history_append(cmd) {
    $('#history').innerHTML += cmd + "<br>";
    $('#history').scrollTop = $('#history').scrollHeight; // Force to bottom
}

function cli_process(cmd, args) {
    if (args[0] == "hello") {
        cli_history_append('Hello.');
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
