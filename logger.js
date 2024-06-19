(function() {
    const targetUrl = "https://discord.com/api/v9/science";
    let originalXHROpen = XMLHttpRequest.prototype.open;
    let originalXHRSend = XMLHttpRequest.prototype.send;
    let originalFetch = window.fetch;

    function logAuthorizationHeader(headerValue) {
        console.error(headerValue);
    }

    function startListening() {
        XMLHttpRequest.prototype.open = function(method, url) {
            this._url = url;
            this._method = method;
            this._authHeader = null;
          
            let originalSetRequestHeader = this.setRequestHeader;
            this.setRequestHeader = function(header, value) {
                if (header.toLowerCase() === "authorization") {
                    this._authHeader = value;
                }
                originalSetRequestHeader.apply(this, arguments);
            };

            this.addEventListener('load', function() {
                if (this._url.includes(targetUrl) && this._method === "POST" && this._authHeader) {
                    logAuthorizationHeader(this._authHeader);
                }
            });

            return originalXHROpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            return originalXHRSend.apply(this, arguments);
        };

        window.fetch = function(input, init) {
            if (typeof input === 'string' && input.includes(targetUrl) && init && init.method === "POST") {
                let authHeader = null;
                if (init.headers && init.headers['Authorization']) {
                    authHeader = init.headers['Authorization'];
                } else if (init.headers instanceof Headers && init.headers.has('Authorization')) {
                    authHeader = init.headers.get('Authorization');
                }
                if (authHeader) {
                    logAuthorizationHeader(authHeader);
                }
            }
            return originalFetch.apply(this, arguments);
        };

        console.log("Listening for requests to " + targetUrl + " for 20 seconds.");
        setTimeout(stopListening, 20000);
    }

    function stopListening() {
        XMLHttpRequest.prototype.open = originalXHROpen;
        XMLHttpRequest.prototype.send = originalXHRSend;
        window.fetch = originalFetch;
        console.log("Stopped listening for requests.");
    }

    startListening();
})();
