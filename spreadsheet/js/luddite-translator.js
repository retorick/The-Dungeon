if (Array.prototype.forEach === undefined) {
    console.log('Browser does not natively support array.forEach');
    Array.prototype.forEach = function(fn) {
        var arr = this;
        for (var i = 0, j = arr.length; i < j; i++) {
            fn(arr[i]);
        }
    };
}


if (Array.prototype.some === undefined) {
    console.log('Browser does not natively support array.som');
    Array.prototype.some = function(fn) {
        var arr = this,
            result = false,
            ndx = 0;
        
        while (ndx < arr.length && result === false) {
            result = fn(arr[ndx]);
        }
        return result;
    };
}

