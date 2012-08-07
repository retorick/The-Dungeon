var aggregate = (function() {
    return {
        SUM: function(data) {
            var sum = 0;
            data.forEach(function(n) { sum += 1*n; });
            return sum;
        },

        AVG: function(data) {
            var avg = this.SUM(data) / data.length;
            return avg;
        },

        MAX: function(data) {
            var max = Math.max.apply(null,data);
            return max;
        },

        MIN: function(data) {
            var min = Math.min.apply(null,data);
            return min;
        },

        zenzizenzizenzic: null
    };
})();

