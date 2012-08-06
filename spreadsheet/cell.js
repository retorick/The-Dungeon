function Cell(id) {
    this.listeners = [];
    this.id = id;
    this.value = '';
    this.formula = '';
    this.cellsToListenTo = [];
    this.listeningTo = [];
}

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
            var newFormula = obj.innerHTML = obj.innerHTML.toUpperCase();
            var newValue;
            if (newFormula.charAt(0) === '=') {
                newFormula = newFormula.substr(1);
//                newValue = Parser.parse(newFormula);
//                this.cells[id].cellsToListenTo = Parser.cellsReferenced;
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


// This stuff goes into cellmanager.js
CellManager.activateCurrentCell = function() {
    var id = CellNavigation.currentCellId,
        el = document.getElementById(id),
        cell = this.cells[id],
        formula = cell.formula,
        value = cell.value;
    el.contentEditable = true;
    // value is what the cell displays; formula is the calculation that produces value.
    // if the cell is active, it needs to show the formula.
    if (value != formula) {
        el.innerHTML = '=' + formula;
    }
    else {
        el.innerHTML = value;
    }
    el.focus();
    CellNavigation.isCurrentCellActive = true;
};


CellManager.deActivateCurrentCell = function() {
    var cell = document.getElementById(CellNavigation.currentCellId);
    cell.contentEditable = false;
    cell.blur();
    CellNavigation.isCurrentCellActive = false;
};


// this method is only used when a symbol key (rather than a navigation key) activates a cell.
CellManager.clearCurrentCellDisplay = function() {
    var id = CellNavigation.currentCellId,
        el = document.getElementById(id);
    el.innerHTML = '';
};


CellManager.clearCurrentCell = function() {
    var id = CellNavigation.currentCellId,
        el = document.getElementById(id);
    el.innerHTML = '';
    CellManager.checkStatus(el);    
};


