var Redis = require('redis');

var client = Redis.createClient();


client.on( 'error', function( err ){
    console.log( 'There was an error: ' + error );
});
client.on( 'subscribe', function( channel, payload ){
    //define when subscribing
    console.log( 'Client subscribe to ' + channel );
});

client.on( 'message', function( channel, message ){
    //define when sending messages
    console.log( message );
});
