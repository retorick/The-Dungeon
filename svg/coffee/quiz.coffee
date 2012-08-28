class QuizItemCollection
    _instance = undefined

    @get: ->
        _instance ?= new _QICollection


class _QICollection
    constructor: ->

    # array of quiz items, including those not in pool.
    _quizItems = []

    # pool is array of items that will be selected for questions.
    _pool = []

    # remedial pool will contain items the user got wrong.
    _remedialPoolObj = {}


    ###
    Restock pool from quiz items list.
    ###
    _refreshPool = ->
        for q, i in _quizItems
            if q.remedial or not q.asked
                _pool.push(q)
        _pool


    ###
    Private function for adding a quiz item object to the list of quiz items.
    ###
    _addToQuizItems = (qiObj) ->
        _quizItems.push(qiObj)
        return


    ###
    Private function for adding a quiz item object to the quiz pool.
    ###
    _addToPool = (qiObj) ->
        _pool.push(qiObj)
        return

    ###
    When the user gets an item wrong, add it as a key/value pair to the remedial
    pile.
    ###
    _addToRemedial = (qiObj) ->
        _remedialPoolObj[qiObj.id] = qiObj
        return
        
    ###
    When an item has been presented, remove it from the pool, so it won't be
    selected again during the current quiz cycle.
    Add the item to the remedial pile if the user got it wrong.
    ###
    _removeFromPool = (ndx, remedial) ->
        _removedItem = _pool.splice(ndx, 1)[0]
        _addToRemedial(_removedItem) if remedial
        return

    ###
    Once the user has gone through all the quiz items, dump anything in the
    remedial pile back into the pool.
    ###
    _putRemedialBackInPool = ->
        for _key, _qi of _remedialPoolObj
            _qi.remedial = false
            _pool.push(_qi)
        _remedialPoolObj = {}
        _pool.length


    ###
    Go through the items in the pool, and get the one whose key matches the
    key this is searching for.  The key is the id property of the item.
    ###
    _findKeyInPool = (key) ->
        for p, i in _pool
            if p.id is key
                return i;
        null


    ###
    Return the size of the pool, for use in selecting a random quiz item.
    ###
    _getPoolSize = ->
        _pool.length


    ###
    Add quiz item to pool, by quiz item object.
    ###
    add: (qi) ->
        _addToQuizItems(qi)
        _addToPool(qi)
        return

    ###
    Remove quiz item from pool, by key.
    ###
    @removeFromPool: (key, remedial) ->
        _pndx = _findKeyInPool(key)
        if _pndx isnt null
            _removeFromPool(_pndx, remedial)
        return


    ###
    Select random quiz item from pool. Return quiz item object.
    ###
    selectRandomItem: ->
        _ndx = Math.floor(Math.random() * _getPoolSize())
        _pool[_ndx]


    ###
    Check to see if pool is empty.  If it is, put remedial items back in, and
    check again.  If pool is still empty, return true.
    ###
    empty: ->
        unless _pool.length is 0
            return false
        else
            _putRemedialBackInPool()
            return _pool.length is 0



class QuizItem
    constructor: (data) ->
        @contextObject = data.contextObj
        @id = data.id
        @asked = data.asked
        @remedial = data.remedial
        @correctResponse = data.correctResponse
        @highlightFn = data.highlightFn
        @unhighlightFn = data.unhighlightFn


    unhighlight: ->
        @unhighlightFn(@remedial)

    highlight: ->
        @highlightFn()

    ###
    hasBeenAsked: ->
        @asked
    ###

    isCorrectAnswer: (answer) ->
        _correct = answer is @correctResponse
        if _correct then @markCorrect() else @markIncorrect()
        _QICollection.removeFromPool(@id, @remedial)
        _correct

    markCorrect: ->
        @asked = true
        return

    markIncorrect: ->
        @asked = true
        @remedial = true
        return

