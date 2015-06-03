var Util = require( 'findhit-util' ),
    Class = require( 'findhit-class' ),
    Http = require( 'http' ),
    Redis = require( 'redis' ),
    bodyparser = require( 'body-parser'),
    connect = require('connect');

var Server = Class.extend({

    statics: {
        createServer: function () {
            return Server.construct.apply( this, arguments );
        },
    },

    options: {
        host: '0.0.0.0',
        port: 8080,

        redisHost: undefined,
        redisPort: undefined,

        endpointHost: undefined,
        endpointPort: undefined,

        http: undefined, // defaults to new Http.Server()
    },

    initialize: function ( options ) {
        options = this.setOptions( options );

        return this
            .setHttp()
            .setRedis()
            .reconfigure();
    },

    setHttp: function ( http ) {

        this.http =
            http instanceof Http.Server && http ||
            this.options.http ||
            new Http.Server();

        return this;
    },

    setRedis: function ( redis ) {

        this.io =
            redis instanceof Redis.Server && redis ||
            this.options.redis;

        return this;
    },

    reconfigure: function () {
        var app = connect();
        var server = this;

        var http = this.http,
            redis = this.redis;

        if ( ! http ) {
            throw new TypeError( "no http server specified" );
        }

        if ( ! redis ) {
            throw new TypeError( "no redis server specified" );
        }

        redis.removeAllListeners();
        http.removeAllListeners();

        app.use(bodyparser.JSON);
        app.use(http.on( 'request', function( req, res, next ){
            if(req.url !== '/trigger' && req.url !== '/trigger/'){
                res.end();
                next();
                return;
            }
            var data = req.body;
            var channel = data.channel;
            var payload = data.payload;

            if ( ! channel ) {
                return next( new Error( 'please provide a valid channel' ) );
            }

            if ( ! payload ) {
                return next( new Error( 'please provide a valid payload' ) );
            }

            publish( channel, payload, function ( err ) {
                if ( err ) {
                    return next( err );
                }

                next();
            });
        }));

        return this;
    },

    listen: function ( port, host ) {

        this.options.port = Util.is.Number( port ) && +port || this.options.port;
        this.options.host = Util.is.String( host ) && host || this.options.host;

        if ( ! this.http._handle ) {

            this.http.listen(
                this.options.port,
                this.options.host
            );

        }

        return this;
    },

    destroy: function(){
        this.http.close();
    }

});

function publish ( channel, payload, callback ) {
    payload = JSON.stringify( payload );
    redis.publish( channel, payload, callback );
}

Server.Server = Server;

module.exports = Server;
