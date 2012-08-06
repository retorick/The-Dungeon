Math.factorial = function(x) {
    var fact = 1;
    for (var i = 1; i <= x; i++) {
        fact *= i;
    }
    return fact;
};


Parser = (function () {
    var nextNdx = 0;
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
        simple = _processFactorial(simple);
        simple = _processExponents(simple);
        // make sure simple is clean before eval'ing:  remove everything but \d\. and the four operators.
        simple = _clean(simple);
        eval('result = ' + simple);
        return result;
    };


    var _parse = function(formula, ndx) {
        var char,
            paren,
            value,
            working = '';
        ndx = ndx || 0;
        while (ndx < formula.length) {
            char = formula.charAt(ndx);

            if (char === '(') {
                paren = _parse(formula, ndx+1);
                ndx = nextNdx; // get value stored in last recursion.
                value = _arithmetic(paren);
                working += ''+value; // not addition; string concatenation.
            }

            else if (char === ')') {
                nextNdx = ndx;
                return working;
            }

            else {
                working += char;
            }
            ndx++;
        }
        value = _arithmetic(working);
        return value;
    };


    var _replaceReferences = function(formula) {
        var matchCells,
            cellNdx,
            literal;
        while (matchCells = cellReferences.exec(formula)) {
            cellCoords = matchCells[1];
            Parser.cellsReferenced.push(cellCoords);
            literal = CellManager.lookup(cellCoords);
            literal = literal || 0;
            formula = formula.replace(cellCoords, literal);
        }
        return formula;
    };

    // For now, we're going to not worry about processing functions.
    var _processFunctions = function(formula) {
        var functionPattern = /(sum|avg)/g;
        var matchedFunction = [];
        while (matchedFunction = functionPattern.exec(formula)) {
            fn = matchedFunction[1];
            fnargs = _getFunctionArgs(formula, fn);
            
        }
        return formula;
    };

    var _getFunctionArgs = function(formula, fn) {
        pos = formula.indexOf(fn) + fn.length+1; // put just after opening paren.
        var parenlevel = 1;
        var args = '';
        var formulaLength = formula.length;
        while (parenlevel > 0 && pos < formulaLength) {
            args += formula.charAt(pos);
            pos++;
            if (formula.charAt(pos) == '(') {
                parenlevel++;
            }
            else if (formula.charAt(pos) == ')') {
                parenlevel--;
            }
        }
        return args;
    };


    return {
        cellsReferenced: [],

        parse: function(formula) {
            // initialize array of cells to add as publishers.
            this.cellsReferenced = [];
    //        var reduced = _processFunctions(formula);
            // _replaceReference returns an equation containing literal numbers, operators, and parentheses.
            var literal = _replaceReferences(formula);
            // result should be a number, the value to display in the spreadsheet cell.
            var result = _parse(literal);
            return result;
        }
    };

})();