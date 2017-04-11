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
    if (args[0] == "shutdown") {
        if (args[1] == "-r") {
            window.location.reload();
            return "Rebooting...";
        } else if (args[1] == "-s") {
            // Can't close window itself, redirect to help
            window.location.href = "README.md";
            return;
        } else {
            return "-r : Reboot<br>-s : Shutdown";
        }
    }
    return 'Command not recognized';
}
