/*
 * CellNavigation object:  handles arrow key navigation.
 */
CellCtrls = (function() {
    return {
        // these function as scoped "constants" for the currentCellActivationStatus property.
        INACTIVE: 0,
        BY_ENTER_KEY: 1,
        BY_SYMBOL_KEY: 2,

        // so I don't have to worry about the above stuff not having the trailing comma.
        zenzizenzizenzic: null
    };
})();


CellNavigation = (function() {

    // Get x, y coordinates for current cell.  Current cell is stored in global CellNavigation object.
    function _getCoords() {
        // by default, get coordinates of current cell; however, if a different id is specified, get coordinates for that cell instead.
        var id = arguments.length == 1 ? arguments[0] : CellNavigation.currentCellId,
            x = id.charCodeAt(0) - 64,
            y = id.substr(1);
        return { x: x, y: 1*y };
    }

    // move cell selector from current cell to new one.  identify cells by id attribute of span element.
    function _moveCellSelector(toId) {
        var fromCell = document.getElementById(CellNavigation.currentCellId).parentNode,
            toCell = document.getElementById(toId).parentNode;
        fromCell.style.backgroundColor = '';
        toCell.style.backgroundColor = '#e5eccc';
        CellNavigation.currentCellId = toId;
    }

    function _goToCell(coords) {
        var letter = String.fromCharCode(coords.x + 64),
            number = coords.y,
            targetId = letter + number;
        _moveCellSelector(targetId);
    }

    return {
        currentCellId: 'A1',

        currentCellActivationStatus: CellCtrls.INACTIVE, // INACTIVE || BY_ENTER_KEY || BY_SYMBOL_KEY
        isCurrentCellActive: false,

        deactivateCurrentCell: function() {
            var cell = document.getElementById(CellNavigation.currentCellId);
            cell.contentEditable = false;
            cell.blur();
            CellNavigation.isCurrentCellActive = false;
            CellNavigation.currentCellActivationStatus = CellCtrls.INACTIVE;
        },

        activateCurrentCell: function() {
            // how the current cell was activated.  default is by symbol key.
            var howActivated = arguments.length === 1 ? arguments[0] : CellCtrls.BY_SYMBOL_KEY;

            var id = CellNavigation.currentCellId,
                el = document.getElementById(id),
                cell = CellManager.cells[id],
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
            CellNavigation.currentCellActivationStatus = howActivated;
        },

        clearCurrentCellDisplay: function() {
            var id = CellNavigation.currentCellId,
                el = document.getElementById(id);
            el.innerHTML = '';
        },

        clearCurrentCell: function() {
            var id = CellNavigation.currentCellId,
                el = document.getElementById(id);
            el.innerHTML = '';
            CellManager.checkStatus(el);    
        },


        goToCell: function(id) {
            var cell = CellManager.cells[id];
            var coords = _getCoords();
            _goToCell(_getCoords(id));
        },

        goLeft: function() {
            if (CellNavigation.currentCellActivationStatus !== CellCtrls.BY_ENTER_KEY) {
                CellNavigation.deactivateCurrentCell();
                var coords = _getCoords();
                if (coords.x > 1) {
                    coords.x--;
                    _goToCell(coords);
                }
                // false:  we're hijacking the keystroke for our own nefarious purposes.
                return false;
            }
            // true:  allow the browser to handle the keystroke in ordinary fashion.
            return true;
        },

        goUp: function() {
            if (CellNavigation.currentCellActivationStatus !== CellCtrls.BY_ENTER_KEY) {
                CellNavigation.deactivateCurrentCell();
                var coords = _getCoords();
                if (coords.y > 1) {
                    coords.y--;
                    _goToCell(coords);
                }
                return false;
            }
            return true;
        },

        goRight: function() {
            if (CellNavigation.currentCellActivationStatus !== CellCtrls.BY_ENTER_KEY) {
                CellNavigation.deactivateCurrentCell();
                var coords = _getCoords();
                if (coords.x < spreadsheetParams.cols) {
                    coords.x++;
                    _goToCell(coords);
                }
                return false;
            }
            return true;
        },

        goDown: function() {
            if (CellNavigation.currentCellActivationStatus !== CellCtrls.BY_ENTER_KEY) {
                CellNavigation.deactivateCurrentCell();
                var coords = _getCoords();
                if (coords.y < spreadsheetParams.rows) {
                    coords.y++;
                    _goToCell(coords);
                }
                return false;
            }
            return true;
        }
    };

})();


CellEvents = (function() {

    function _selectAndActivateCell(obj) {
        var cellEl = obj.getElementsByTagName('span')[0];
        CellNavigation.goToCell(cellEl.id);
        CellNavigation.currentCellId = cellEl.id;
        CellNavigation.activateCurrentCell();
    }

    function _processTabKey() {
        CellNavigation.deactivateCurrentCell();
        CellNavigation.goRight();
    }

    function _processEscapeKey() {
        CellNavigation.deactivateCurrentCell();
        CellNavigation.goToCell(CellNavigation.currentCellId);
    }

    function _processDeleteKey() {
        if (CellNavigation.currentCellActivationStatus === CellCtrls.INACTIVE) {
            CellNavigation.clearCurrentCell();
        }
    }

    function _processEnterKey() {
        if (CellNavigation.currentCellActivationStatus === CellCtrls.INACTIVE) {
            CellNavigation.activateCurrentCell(CellCtrls.BY_ENTER_KEY);
        }
        else {
            CellNavigation.deactivateCurrentCell();
            CellNavigation.goDown();
        }
    }

    function _processActivatingSymbolKey() {
        if (CellNavigation.currentCellActivationStatus === CellCtrls.INACTIVE) {
            CellNavigation.activateCurrentCell();
            CellNavigation.clearCurrentCellDisplay();
        }
    }

    // symbols that can be used to activate a cell.  basically, these are the symbols that can occur at the beginning of a cell.
    //   includes all digits, letters, decimal point, equals, and negative.
    function _isActivatingSymbol(k) {
        if (k >= 48 && k <= 57) return true; // qwerty digits
        if (k >= 96 && k <= 105) return true; // keypad digits
        if (k >= 65 && k <= 90) return true; // alphabet
        if (k === 190 || k === 110) return true; // decimal point (qwerty || keypad)
        if (k === 107) return true; // equals sign (also plus sign) in Firefox
        if (k === 187) return true; // equals sign (also plus sign) in Chrome -- and, it looks like, elsewhere
        if (k === 189 || k === 109) return true; // negative sign (qwerty || keypad)
        return false;
    }

    return {
        click: function() {
            _selectAndActivateCell(this);
        },

        keydown: function(e) {
            e = e || window.event;
            var k = e.keyCode;
console.log(k);
            var state = true;

            switch (true) {
                case _isActivatingSymbol(k):
                    _processActivatingSymbolKey();
                    break;
                case k === 9:
                    _processTabKey();
                    state = false;
                    break;
                case k === 13:
                    _processEnterKey();
                    state = false;
                    break;
                case k === 27:
                    _processEscapeKey();
                    break;
                case k === 37: // up arrow
                    state = CellNavigation.goLeft();
                    break;
                case k === 38: // up arrow
                    state = CellNavigation.goUp();
                    break;
                case k === 39: // up arrow
                    state = CellNavigation.goRight();
                    break;
                case k === 40: // down arrow
                    state = CellNavigation.goDown();
                    break;
                case k === 46:
                    _processDeleteKey();
                    break;
                default:
            }
            return state;
        },

        focus: function() {
            var el = this.parentNode;
            var cell = CellManager.cells[this.id];
            var formula = cell.formula;
            var value = cell.value;
            if (value != formula) {
                this.innerHTML = '=' + formula;
            }
            else {
                this.innerHTML = value;
            }
        
        },

        blur: function() {
            var el = this.parentNode;
            el.style.backgroundColor = '';
            CellManager.checkStatus(this);
        }
    };
})();


InitCell = (function() {
    function _makeCellId(x, y) {
        var colLabel = String.fromCharCode(x+64);
        var rowLabel = y;
        var cellId = colLabel + rowLabel;
        
        return cellId;
    }

    return {
        createNullCell: function() {
            return document.createTextNode('');
        },

        createWithLabel: function(label) {
            return document.createTextNode(label);
        },

        createWithCoords: function(x, y) {
            var el = document.createElement('span');
//            el.contentEditable = true;
//            el.onmouseover = CellEvents.mouseover;
//            el.onmouseout = CellEvents.mouseout;
            el.onfocus = CellEvents.focus;
            el.onblur = CellEvents.blur;
            el.style.display = 'block';
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.cursor = 'pointer';
            el.id = _makeCellId(x, y);
            return el;
        }
    };
})();


Spreadsheet = (function() {
    var tableEl, tableBodyEl, trEl, tdEl;

    function _makeTableElement() {
        return document.createElement('table');
    }

    function _makeTbodyElement() {
        return document.createElement('tbody');
    }

    function _makeRowElement() {
        return document.createElement('tr');
    }

    function _makeCellElement(x, y) {
        var cellEl = 'td', cellSetup = InitCell.createNullCell();

        if (y === 0) cellEl = 'th';

        tdEl = document.createElement(cellEl);

        if (y === 0 && x > 0) {
            // column label
            cellSetup = InitCell.createWithLabel(String.fromCharCode(x + 64));
        }
        else if (x === 0 && y > 0) {
            // row label
            cellSetup = InitCell.createWithLabel(y);
        }
        else if (x > 0 && y > 0) {
            cellSetup = InitCell.createWithCoords(x, y);
            tdEl.onclick = CellEvents.click;
        }
        tdEl.appendChild(cellSetup);

        return tdEl;
    }

    function _makeStageCell() {
        var stage = document.createElement('span');
        return stage;
    }

    return {
        stageCell: null,

        tableObject: null,

        build: function(rows, cols) {
            var rowsPlusLabel = rows + 1,
                colsPlusLabel = cols + 1;

            tableEl = _makeTableElement();
            tableBodyEl = _makeTbodyElement();

            for (var y = 0; y < rowsPlusLabel; y++) {
                trEl = _makeRowElement();
                for (var x = 0; x < colsPlusLabel; x++) {
                    trEl.appendChild(_makeCellElement(x, y));
                }
                tableBodyEl.appendChild(trEl);
            }
            tableEl.appendChild(tableBodyEl);
            this.tableObject = tableEl;
        },

        display: function() {
            document.onkeydown = CellEvents.keydown;
            var el = document.getElementById('table-container');
            el.appendChild(this.tableObject);
        }
    };
})();

var data = {
};

var spreadsheetParams = {
    rows:4,
    cols:7
};

window.onload = function() {
    Spreadsheet.build(spreadsheetParams.rows, spreadsheetParams.cols);
    Spreadsheet.display();
    CellManager.initializeCells();
    CellNavigation.goToCell('A1');
};
