/*
 * Constants object
 */
var cnst = {
    maxPeriods: 12,

    // so I don't have to worry about a trailing comma
    zenzizenzizenzic: null
};


/*
 * Global data object:  simply a place to hold values that need to be available to multiple objects.
 */
var data = {
    currentRow: 1,
    clearFieldIfDigit: null,
    originalEl: null,
    originalValue: '',
    fieldToAdjust: null,
    newValue: '',

    // so I don't have to worry about a trailing comma
    zenzizenzizenzic: null
};


/*
 * Formatting object:  Methods having to do with formatting money and percents.
 */
var fmt = (function () {
    return {
        formatMoney: function(amt) {
            amt = '' + amt;
            if (/(\$\s?)?\d{1,2}(,?\d{3})*(\.\d{1,2})?/.test(amt)) {
                var amount = amt.replace(/[^\d.]/g,''),
                    parts = amount.split('.'),
                    d = parts[0],
                    c  = parts[1] ? parts[1] : '00',
                    dollars = '';
                while (d.length > 3) {
                    dollars = ',' + d.substr(d.length - 3); 
                    d = d.substr(0, d.length - 3);
                }
                dollars = d + dollars;
                var cents = (c + '00').substr(0,2),
                    fmtamount = '$' + dollars + '.' + cents;
            }
            else {
                var fmtamount = '';
            }
            return fmtamount;
        },

        unformatMoney: function(m) {
            if (m) {
                m = m.replace(/[^\d.]/g, "");
            }
            return m;
        },

        formatPercent: function(pct) {
            if (/^([\d.]+)(%?)$/.test(pct)) {
                if (RegExp.$2 == "%") {
                    // Entry ends with %.
                }
                else {
                    pct = 1*RegExp.$1;
                    if (pct < 1) {
                        pct *= 100;
                    } 
                    pct += "%";
                }
            }
            else {
                pct = "";
            }
            return pct;
        },

        unformatPercent: function(pct) {
            var pct = pct.replace(/[^\d.]/g, "");
            return pct/100;
        }

    };
})();


/*
 * Financial calculations object:  Methods used for calculation.
 */
var fin = (function() {

    return {
        calcInvestment: function(rate, targetamount, month) {
            var investment = targetamount / Math.pow(1+rate/12, month);
            return investment;
        },

        calcRate: function(investment, targetamount, month) {
            var rate = Math.pow(targetamount / investment, 1/month) - 1;
            rate = Math.round(rate * 120000) / 10000;
            return rate;
        },

        futureValue: function(principal, periodrate, period) {
            var fv = principal * Math.pow(1 + periodrate, period);
            return fv;
        },

        zenzizenzizenzic: null
    };

})();


/*
 * DOM manipulation object:  for methods having to do with how elements are displayed and arranged.
 */
var dom = (function() {
    var c1 = [],
        c2 = [];

    function _createTextNode(value) {
        var node = document.createTextNode(value);
        return node;
    }

    function _createElement(el) {
        var node = document.createElement(el);
        return node;
    }

    return {
        clearBackground: function(elList) {
            if (Array.forEach) {
                elList = Array.prototype.slice.call(elList);
                elList.forEach(function(el, ndx, arr) { el.style.background = ''; });
            }
            else {
                console.log('your browser appears to suck.');
            }
        },


        makeAmountSpan: function(ndx, value) {
            var item = _createElement('span');
            var amtNode = _createTextNode(value);
            item.id = 'amt_' + ndx;
            item.contentEditable = true;
            item.onfocus = evt.openAmount;
            item.onblur = evt.closeAmount;
            item.onkeydown = evt.checkKeydown;
            item.appendChild(amtNode);
            return item;
        },


        // an amount cell has changed; need to determine new interest rate or principal and recalculate.
        updateFieldsAndAmounts: function() {
            var period = data.originalEl.id.substr(4),
                investment, rate;

            // get target amount by altering initial investment.
            if (data.fieldToAdjust === els.principal) {
                rate = fmt.unformatPercent(els.interest.value);
                investment = fin.calcInvestment(rate, data.newValue, period);
                els.principal.value = fmt.formatMoney(investment);
            }

            // get target amount by altering interest rate.  this is the default option.
            else {
                investment = fmt.unformatMoney(els.principal.value);
                rate = fin.calcRate(investment, data.newValue, period);
                els.interest.value = fmt.formatPercent(rate);
            }
            dom.calculate();

            // Reset cell data.
            data.newValue = '';
            data.originalValue = '';
            data.originalEl = null;
        },


        calculate: function() {
            var pv = fmt.unformatMoney(els.principal.value),
                rate = fmt.unformatPercent(els.interest.value),
                periodrate = rate / 12,
                resultsTable = els.resultsTable,
                firstPeriod = 1,
                lastPeriod = cnst.maxPeriods,
                periodCell,
                fv, newRow, formattedAmount;

            for (var period = firstPeriod; period <= lastPeriod; period++) {
                fv = fin.futureValue(pv, periodrate, period);
                periodCell = _createTextNode(period);
                formattedAmount = fmt.formatMoney(fv);
                calcwrap = dom.makeAmountSpan(period, formattedAmount);
                if (!c1[period]) {
                    newRow = resultsTable.insertRow(-1);
                    newRow.onmouseover = evt.highlightOn;
                    newRow.onmouseout = evt.highlightOff;
                    newRow.onclick = evt.toggleEditRow;
                    c1[period] = newRow.insertCell(-1); 
                    c2[period] = newRow.insertCell(-1); 
                    c1[period].appendChild(periodCell);
                    c2[period].appendChild(calcwrap);
                }
                else {
                    c2[period].replaceChild(calcwrap, c2[period].firstChild);
                }
            }

            period = 1*lastPeriod + 1;
            while (resultsTable.rows.length > lastPeriod) {
                resultsTable.deleteRow(period - 1);
            }

            c1.length = lastPeriod;
            c2.length = lastPeriod;
            setup.instruction(1);
        }

    };
})();


/*
 * Event Handlers object:  methods for handling events and for triggering events.
 */
var evt = (function() {

    function _goToPreviousRow() {
        if (data.currentRow.previousSibling && data.currentRow.previousSibling.getElementsByTagName('span').length > 0) {
            data.currentRow.previousSibling.getElementsByTagName('span')[0].focus();
        }
    }

    function _goToNextRow() {
        if (data.currentRow.nextSibling) {
            data.currentRow.nextSibling.getElementsByTagName('span')[0].focus();
        }
    }

    function _processUpArrow() {
        data.clearFieldIfDigit = true;
        _goToPreviousRow();
    }

    function _processDownArrow() {
        data.clearFieldIfDigit = true;
        _goToNextRow();
    }

    function _processTabKey() {
        data.clearFieldIfDigit = true;
    }

    function _processDigitKey(cellObj) {
        if (data.clearFieldIfDigit) {
            cellObj.innerHTML = '';
            data.clearFieldIfDigit = false;
        }
    }

    return {
        trigger: function(el, whichEvent) {
            el[whichEvent]();
        },

        fldBlur: function() {
            if (this === els.principal) {
                this.value = fmt.formatMoney(this.value);
            }
            else if (this === els.interest) {
                this.value = fmt.formatPercent(this.value);
            }
            dom.calculate();
        },

        highlightOff: function() {
            this.style.backgroundColor = data.rowBackgroundColor || '';
            this.style.cursor = '';
        },

        highlightOn: function() {
            data.rowBackgroundColor = this.style.backgroundColor;
            this.style.backgroundColor = '#cccccc';
            this.style.cursor = 'pointer';
        },

        setRowSelected: function(e) {
            this.style.backgroundColor = '#f90';
            data.rowBackgroundColor = this.style.backgroundColor;
        },

        setRowUnselected: function(e) {
            this.style.backgroundColor = '';
            data.rowBackgroundColor = this.style.backgroundColor;
        },

        selectField: function(e) {
            e = e || window.event;
            dom.clearBackground(els.labels);
            this.style.background = '#f90';
            data.fieldToAdjust = this.getElementsByTagName('input')[0];
        },

        toggleEditRow: function(e) {
            var elAmtSpan = this.getElementsByTagName('span')[0];
            evt.trigger(elAmtSpan, 'focus');
            evt.openAmount.call(elAmtSpan);
        },

        openAmount: function(e) {
            var thisRow = this.parentNode.parentNode;
            evt.setRowSelected.call(thisRow);
            var elAmtSpan = thisRow.getElementsByTagName('span')[0];
            data.originalEl = elAmtSpan;
            data.originalValue = fmt.unformatMoney(this.innerHTML);
            data.currentRow = thisRow;
        },

        closeAmount: function(e) {
            var thisRow = this.parentNode.parentNode;
            data.newValue = fmt.unformatMoney(this.innerHTML);
            if (data.newValue != data.originalValue) { 
                this.innerHTML = fmt.formatMoney(data.newValue);
                dom.updateFieldsAndAmounts.call(this);
            } 
            thisRow.style.backgroundColor = '';
        },

        checkKeydown: function(e) {
            e = e || window.event;
            var k = e.keyCode;
console.log(e.keyCode);
            switch (true) {
                case k >= 48 && k <= 57: // qwerty digits 
                case k >= 96 && k <= 105: // keypad digits
                    _processDigitKey(this);
                    break;
                case k === 9:
                    _processTabKey();
                    break;
                case k === 38: // up arrow
                    _processUpArrow();
                    break;
                case k === 40: // down arrow
                    _processDownArrow();
                    break;
                default:
            }
            return true;
        },

        // So I don't have to worry about a trailing comma.
        zenzizenzizenzic: null

    };
})();


/*
 * Global scope initialization function:  returns object containing methods for setting things up.
 */
var initialize = function() {
    var instNdx = -1;
    return {
        instruction: function(n) {
return;
            if (instNdx != n) {
                document.getElementById("inst" + n).style.backgroundColor = "#cccccc"; 
                if (instNdx > -1) {
                    document.getElementById("inst" + instNdx).style.backgroundColor = ""; 
                }
                instNdx = n;
            }
        },

        initFocus: function() {
            setup.instruction(0);
            els.principal.focus();
        },

        getDomHighlights: function() {
            return {
                principal: document.getElementById('txt-principal'),
                principalLabel: document.getElementById('txt-principal').parentNode,
                interest: document.getElementById('txt-interest'),
                interestLabel: document.getElementById('txt-interest').parentNode,
                labels: document.getElementsByTagName('label'),
                resultsTable: document.getElementById('results')
            }
        },

        setEventHandlers: function() {
            els.principal.onblur = evt.fldBlur;
            els.interest.onblur = evt.fldBlur;
            els.principalLabel.onclick = evt.selectField;
            els.interestLabel.onclick = evt.selectField;
        },

        zenzizenzizenzic: null
    };
};


// els: global object containing key DOM elements.
// setup;  global object containing setup methods
var els = {}, setup = {};


window.onload = function() {
    setup = initialize();
    els = setup.getDomHighlights();    

    setup.setEventHandlers();
    dom.calculate();
    setup.initFocus();

};

