/*
 * Cell object:  contains "under-the-hood" data for each cell in the spreadsheet.
 *      Each cell has a list of other cells that depend on its value.  Whenever
 *      a cell's value changes, each "listener" cell is notified so it can be 
 *      updated.
 *
 *      The id parameter, which is passed to the constructor when a new cell is
 *      created, is a string containing the standard spreadsheet cell reference; 
 *      e.g., B5.
 *      
 */
function Cell(id) {
    // array of cells that are listening to current cell.
    this.listeners = [];
    this.id = id;
    this.value = '';
    this.formula = '';
    this.error = false; // error in cell?
    // list gathered by parser each time a cell changes.
    this.cellsToListenTo = [];
}


/*
 * propagateChange method:  iterates through the context Cell object's
 *      listeners (which are themselves Cell objects) and invokes the
 *      setValueAndFormula method for each.
 */
Cell.prototype.propagateChange = function() {
    var cell;
    // here, we may want to compute the value based on the formula, not rely on a "value" property.
    var newValue = this.value;
    for (var i = 0, j = this.listeners.length; i < j; i++) {
        cell = this.listeners[i];
        cell.setValueAndFormula(cell.formula, true);
    }
    return this;
};


Cell.prototype.hasListener = function(cellObj) {
    var hasListener = false;
    var publisher = this;

    function _checkForListener(publisher) {
        var hasListener = false;
        var obj, ndx = 0;
        while (hasListener === false && ndx < publisher.listeners.length) {
            obj = publisher.listeners[ndx];
            if (obj === cellObj) {
                hasListener = true;
                
            }
            else {
                if (obj.listeners.length > 0) {
                    hasListener = _checkForListener(obj);
                }
            }
            ndx++;
        }
        return hasListener;
    }

    hasListener = _checkForListener(publisher);

    return hasListener;
};


/*
 * beginListening method:  receives a Cell object (cellObj) from which the 
 *      context Cell object needs to receive notifications of updates.
 *      The context object is added to the listeners for the object received
 *      as a parameter.
 * 
 *      For instance, suppose cell B5 has just been updated to contain the
 *      formula '=A1*B1/2'.  The Cell objects for both A1 and B1 need to be
 *      informed that B5 is listening for their values so that if either of them
 *      changes, it can change as well.  
 */
Cell.prototype.beginListening = function(cellObj) {
    var that = this;
    var alreadyListening = cellObj.listeners.some(
        function(c) {
            return that === c;
        }
    );
    var listensTo = this.hasListener(cellObj);
    try {
        if (listensTo) {
            this.value = null;
            this.error = true;
            throw '[beginListening] ' + this.id + ' already listens to ' + cellObj.id + '.  Circular reference.';
        }
        else if (!alreadyListening) {
            cellObj.listeners.push(this);
        }
    }
    catch (e) {
        console.log(e);
    }
    return this;
};


/*
 * subscribeToReferencedCells method:  the Parser generates a list of cell IDs
 *      contained in a cell's formula and makes this available for assignment
 *      to the Cell object's cellsToListenTo property.
 *      The subscribeToReferencedCells method iterates through this array and
 *      invokes the Cell object's beginListening method, passing the cell
 *      object to which the cell must listen, as described in the beginListening
 *      comments.
 */
Cell.prototype.subscribeToReferencedCells = function() {
    var thisCell = this;
    this.cellsToListenTo.forEach(
        function(id) {
            // cellObj is the Cell object for each cell whose ID is listed in cellsToListenTo.
            var cellObj = CellManager.cells[id];
            thisCell.beginListening(cellObj);
        }
    );
};


/*
 * setValueAndFormula method:  invoked whenever a change is detected in a cell's
 *      content.  This happens directly through CellManager.checkStatus, in the
 *      event that Cell object content is found to differ from entered content.
 *      In this case, the cellContent parameter is the literal content that was
 *      entered into the cell, and the isFormula flag is set to true if that
 *      content was determined to be a formula (first character is '=').
 *
 *      This method is also invoked by Cell.propagateChange, in which case a
 *      cell's existing formula is passed as the cellContent and the isFormula
 *      flag is set to true.  In this case, a cell to which the cell is listening
 *      has been modified, and this cell must re-evaluate its formula in order
 *      to determine the correct value to display.
 *
 *      Parameters:
 *        cellContent:  the literal content entered into the cell.
 *        isFormula:  true if the content is a formula; false otherwise.
 *      
 *      Set the Cell object's value, formula, and error properties.  If the
 *      cell content is a formula, the value is the result of parsing the formula.
 *      Otherwise, the value and the formula are the same.
 *
 *      Once the Cell properties have been updated, three things must happen:
 *      * The Cell must begin listening to any cells referenced in the formula.
 *      * The spreadsheet must be update to reflect the cell value (important
 *        if a formula was entered).
 *      * The Cell object must propagate its changes to any cells that depend
 *        on its value.
 *        
 */
Cell.prototype.setValueAndFormula = function(cellContent, isFormula) {
    var newValue = cellContent, newFormula = cellContent;
    if (isFormula) {
        newValue = Parser.parse(cellContent);
        this.cellsToListenTo = Parser.cellsReferenced;
    }

    this.error = newValue === null; // will only occur with parse error in formula.
    if (newValue !== this.value) { // no need to update value and propagate change unless value has changed.
        this.value = newValue;
        this.propagateChange();    
    }
    this.refreshCellDisplay(); // this actually doesn't need to happen if the cell contains a value that hasn't changed.
    if (newFormula !== this.formula) { // no need to update formula or subscriptions unless formula has changed.
        this.formula = newFormula;
        this.subscribeToReferencedCells();
    }
};


/*
 * refreshCellDisplay method:  Simply updates the DOM element representing the
 *      context Cell object.
 *
 *      If the cell's value is a null, indicating an error in the formula, or
 *      in a formula of a cell in the listening chain, an error indicator is
 *      displayed.
 */
Cell.prototype.refreshCellDisplay = function() {
    document.getElementById(this.id).innerHTML = this.value === null ? '!ERROR' : this.value;
};



/*
 * CellManager object:  maintains array of all Cell objects in the spreadsheet.
 * 
 * initializeCells method:  invoked when the spreadsheet is loaded:  builds
 *      an array containing a Cell object for each cell in the spreadsheet, as
 *      determined by the specified number of rows (spreadsheetParams.rows) and
 *      columns (spreadsheetParams.cols).
 *
 * checkStatus method:  invoked whenever a blur event is detected on a cell
 *      DOM element.  Method is also invoked when a deletion event is detected.
 *      This method compares the cell's literal content with the formula in the
 *      cell's corresponding Cell object.  If the two differ, indicating the
 *      cell has been updated, the setValueAndFormula method is invoked for
 *      the Cell object.
 *
 * lookup method:  returns the Cell object's value property.  If the cell
 *      contains a formula, this property is the result of evaluating that
 *      formula.
 */
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
            var cellContent = obj.innerHTML;
            var newContent = cellContent;
            var triggerUpdate = false;
            var isFormula = false;

            if (cellContent.charAt(0) === '=') {
                newContent = cellContent.toUpperCase();
                isFormula = true;
            }
            triggerUpdate = newContent != currentFormula;
            if (triggerUpdate || isFormula) {
                this.cells[id].setValueAndFormula(newContent, isFormula);
            }
        },

        lookup: function(coords) {
            return this.cells[coords].value;
        }

    };
})();
/*
 * updateValue method:  update the value property of the Cell object.  If there
 *      is an error in the formula, the value is set to null and the error flag
 *      to true.
 *
 *      The value property is what's typically displayed in the cell; therefore
 *      an update to the value must be reflected on the screen.  This is the
 *      job of the refresh() method.
 *
 *      Also, when a value is updated, any cells containing formulas that refer
 *      to this cell must be notified of the change so that they can update
 *      their values.  This is the function of propagateChange(). 
 */
/*
Cell.prototype.updateValue = function(newValue) {
    this.value = newValue;
    this.error = newValue === null; // set or clear cell's error flag.
console.log('Error in cell ' + this.id + '? ' + this.error);
    this.refresh();
    this.propagateChange();
};
*/


/*
 * updateFormla method:  the object context, a Cell object, contains the cell's 
 *      value, formula, listeners, &c.  This method updates the formula and also
 *      subscribes (beginListening) the object to any cell objects referenced in 
 *      the formula (cellsToListenTo).
 *
 *      The cellsToListenTo is a sequential array of cell IDs, generated by the
 *      Parser object.  A cell ID is simply the cell reference string in 
 *      standard spreadsheet form; e.g., 'B7'. 
 */
/*
Cell.prototype.updateFormula = function(newFormula) {
    var thisCell = this;
    this.formula = newFormula;
    this.cellsToListenTo.forEach(
        function(id) {
            // cellObj is the Cell object for each cell whose ID is listed in cellsToListenTo.
            var cellObj = CellManager.cells[id];
            thisCell.beginListening(cellObj);
        }
    );
};
*/


