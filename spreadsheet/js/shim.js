if (Array.prototype.forEach === undefined) {
    console.log('Browser does not natively support array.forEach');
    Array.prototype.forEach = function(fn) {
        var arr = this;
        for (var i = 0, j = arr.length; i < j; i++) {
            fn(arr[i]);
        }
    };
}
