Math.factorial = function(x) {
    var fact = 1;
    for (var i = 1; i <= x; i++) {
        fact *= i;
    }
    return fact;
};


Parser = (function () {
    var cellReferences = /([a-zA-Z]+\d+)/g;
    var powPattern = /(\d*(\.\d+)?)\^(\d*(\.\d+)?)/g;
    var factPattern = /(\d+)!/g;
    var sanitizePattern = /[^\d\.\+\-\/\*]/g;

    var _processFactorial = function(simple) {
        var matchFactorial,
            expression,
            replacement,
            x;
        while (matchFactorial = factPattern.exec(simple)) {
            expression = matchFactorial[0];
            x = matchFactorial[1];
            replacement = Math.factorial(x);
            simple = simple.replace(expression, replacement);
        }
        return simple;
    }

    var _processExponents = function(simple) {
        var matchPowers,
            expression,
            replacement,
            x, y;
        while (matchPowers = powPattern.exec(simple)) {
            expression = matchPowers[0];
            x = matchPowers[1];
            y = matchPowers[3];
            replacement = Math.pow(x, y);
            simple = simple.replace(expression, replacement);
        }
        return simple;
    };

    var _clean = function(simple) {
        simple = simple.replace(sanitizePattern, '');
        return simple;
    };

    var _arithmetic = function(simple) {
        var result = 0;
        try {
            if (typeof simple === 'string' && simple.length > 0) {
                simple = _processFactorial(simple);
                simple = _processExponents(simple);
                // make sure simple is clean before eval'ing:  remove everything but \d\. and the four operators.
                simple = _clean(simple);
                eval('result = ' + simple);
                return result;
            }
            else throw '[_arithmetic] Error in formula: check for imbalanced parentheses';
        }
        catch (e) {
            console.log(e);
        }
    };


    var _parse = function(formula) {
        var char,
            ndx = 0,
            paren_depth = 0,
            group = [''],
            paren,
            value;
        formula = formula || '';
        while (ndx < formula.length) {
            char = formula.charAt(ndx);

            if (char === '(') {
                paren_depth++;
                group[paren_depth] = '';
            }

            else if (char === ')') {
                value = _arithmetic(group[paren_depth]);
                paren_depth--;
                group[paren_depth] += '' + value;
            }

            else {
                group[paren_depth] += '' + char;
            }
            ndx++;
        }
        try {
            if (paren_depth == 0) {
                value = _arithmetic(group[0]);
            }
            else throw '[_parse] Error in formula: check for imbalanced parentheses';
        }
        catch (e) {
            console.log(e);
            value = null;
        }

        return value;
    };


    var _replaceReferences = function(formula) {
        var matchCells,
            cellNdx,
            cellValue;
        while (matchCells = cellReferences.exec(formula)) {
            cellCoords = matchCells[1];
            Parser.cellsReferenced.push(cellCoords);
            cellValue = CellManager.lookup(cellCoords);
            cellValue = cellValue || 0;
            formula = formula.replace(cellCoords, cellValue);
        }
        return formula;
    };

    // For now, we're going to not worry about processing functions.
    var _processRangeFunctions = function(formula) {
        var functionPattern = /(SUM|AVG|MAX|MIN)\(([A-Z]\d{1,2}):([A-Z]\d{1,2})\)/g;
        var matchedFunction = [];
        while (matchedFunction = functionPattern.exec(formula)) {
            match = matchedFunction[0];
            fn = matchedFunction[1];
            args = matchedFunction.slice(2,4);
            data = _grabValuesInRange(args);
            value = aggregate[fn](data);
            formula = formula.replace(match, value);
            
        }
        return formula;
    };

    var _grabValuesInRange = function(range) {
        var id,
            start = CellCtrls.idToCoords(range[0]),
            end = CellCtrls.idToCoords(range[1]),
            values = [];
        for (var x = start.x; x <= end.x; x++) {
            for (var y = start.y; y <= end.y; y++) {
                id = CellCtrls.coordsToId(x, y);
                Parser.cellsReferenced.push(id);
                values.push(CellManager.cells[id].value);
            }
        }
        return values;
    };

    return {
        cellsReferenced: [],

        parse: function(formula) {
            // initialize array of cells to add as publishers.
            this.cellsReferenced = [];
            var reduced = _processRangeFunctions(formula);
            // _replaceReference returns an equation containing literal numbers, operators, and parentheses.
            var literal = _replaceReferences(reduced);
            // result should be a number, the value to display in the spreadsheet cell.
            var result = _parse(literal);
            return result;
        }
    };

})();
