// Create a markdown-formatted list of projects and their notification settings

var header = [
    "##Drillplan Notification Settings",
    "___"
]

var line = " - **{{project}}:** {{events}}"

function createMessage (subscriptions: {[key: string]: string[]}) {
    var body = []
    for (let project in subscriptions) {
        var nextLine = line.replace("{{project}}", project);
        if (subscriptions[project].length > 0) {
            nextLine = nextLine.replace("{{events}}", subscriptions[project].join(', '));
        } else {
            nextLine = nextLine.replace("{{events}}", "No events");
        }
        body.push(nextLine);
    }

    // concatenate message into a single string
    return header.concat(body).join('\n');
}

exports.createMessage = createMessage;