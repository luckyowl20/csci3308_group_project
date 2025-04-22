const Handlebars = require('handlebars');


module.exports = {
    eq: function (a, b) {
        // console.log("Equating two user id:",a,b);
        return a === b;
    },

    debug: function (optionalValue) {
        // If no value is passed, use the current context.
        let context = optionalValue || this;
        // console.log("debug being called")
        console.log(optionalValue)
    },

    // for inserting scripts into the main layout from a page's .hbs
    section: function (name, options) {
        // console.log("section called with", options) // debug line
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
    },

    formatDate: function (date) {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0]; // Returns YYYY-MM-DD
    },

    setVar: function (varName, varValue, options) {
        options.data.root[varName] = varValue;
    },

    getVar: function (varName, options) {
        return options.data.root[varName];
    },

    jsonParse: function (varName, string, options) {
        options.data.root[varName] = JSON.parse(string);
    },

    json(context) {
        return new Handlebars.SafeString(JSON.stringify(context));
    }

};