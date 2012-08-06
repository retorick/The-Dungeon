/*
 * Cell object:  contains "under-the-hood" data for each cell in the spreadsheet.
 *               each cell has a list of other cells that depend on its value.
 *               whenever a cell's value changes, each "listener" cell is notified so it can be updated.
 */
function Cell(id) {
    // array of cells that are listening to current cell.
    this.listeners = [];
    this.id = id;
    this.value = '';
    this.formula = '';
    // list gathered by parser each time a cell changes.
    this.cellsToListenTo = [];
    // currently unused
    this.listeningTo = [];
}


// go through a cell's listeners and provide each with updated value.
Cell.prototype.propagateChange = function() {
    var cell;
    // here, we may want to compute the value based on the formula, not rely on a "value" property.
    var newValue = this.value;
    for (ndx in this.listeners) {
        cell = this.listeners[ndx];
        newValue = Parser.parse(cell.formula);
        cell.updateValue(newValue);
    }
    return this;
};


Cell.prototype.beginListening = function(cell) {
    var that = this;
    var alreadyListening = cell.listeners.some(
        function(c) {
            return that === c;
        }
    );
    if (!alreadyListening) {
        cell.listeners.push(this);
    }
    return this;
};


Cell.prototype.updateValue = function(newValue) {
    // Thew new value actually needs to update the formula, not the value itself.
    this.value = newValue;
    this.refresh();
    this.propagateChange();
};


Cell.prototype.updateFormula = function(newFormula) {
    var thisCell = this;
    this.formula = newFormula;
    this.cellsToListenTo.forEach(
        function(id) {
            var cellToListenTo = CellManager.cells[id];
            thisCell.beginListening(cellToListenTo);
        }
    );
};


Cell.prototype.refresh = function() {
    document.getElementById(this.id).innerHTML = this.value;
};




CellManager = (function() {
    return {
        currentlyActive: null,

        initializeCells: function() {
            var cells = {},
                id;
            for (var y = 0; y < spreadsheetParams.rows; y++) {
                for (var x = 0; x < spreadsheetParams.cols; x++) {
                    linearNdx = y*spreadsheetParams.cols + x;
                    id = String.fromCharCode(65 + x) + (y + 1);
                    cells[id] = new Cell(id);
                }
            }
            this.cells = cells;
        },

        checkStatus: function(obj) {
            var id = obj.id;
            var currentFormula = this.cells[id].formula;
            var newFormula = obj.innerHTML;
            var newValue;
            if (newFormula.charAt(0) === '=') {
                newFormula = newFormula.toUpperCase();
                newFormula = newFormula.substr(1);
                newValue = Parser.parse(newFormula);
                this.cells[id].cellsToListenTo = Parser.cellsReferenced;
            }
            else {
                newValue = newFormula;
            }
            if (1 || newFormula !== currentFormula) {
                this.cells[id].updateFormula(newFormula);
                this.cells[id].updateValue(newValue);
            }
        },

        lookup: function(coords) {
            cellNdx = coords;
            literal = this.cells[cellNdx].value;
            return literal;
        }

    };
})();
