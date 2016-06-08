function greeter(person: string) {
    return "Hello, " + person;
}

var user = "Jane Person";

document.body.innerHTML = greeter(user);