import _ from 'lodash';
import stableStringify from 'json-stable-stringify';

/**
 * Recursive internal function for building references to nested OrderedObjects
 * @param root - The OrderedObject to start from
 * @param data - The corresponding data
 * @param ordering - The corresponding object ordering
 */
function buildSubObjects(root, data, ordering) {
    function createChild(data, ordering, key) {
        let child;
        if (_.isArray(data[key])) {
            child = [];
        } else if (_.isObjectLike(data[key])) {
            child = new OrderedObject(data[key], ordering[key]);
        } else {
            return;
        }
        return child;
    }

    function addChild(target, key, child) {
        if (_.isArray(target)) {
            target.push(child);
        } else if (_.isObjectLike(target)) {
            Object.defineProperty(target, key, {
                value: child,
                writable: false,
                enumerable: true,
                configurable: false
            });
        }
    }

    _.map(data, (value, key) => {
        const child = createChild(data, ordering, key);
    if (!child)
        return;
    addChild(root, key, child);
    if (_.isArray(child))
        buildSubObjects(child, data[key], ordering[key]);
});
}

/**
 * Apply a change to a nested value and its ordering
 * @param path - Path to the nested value
 * @param operation - Function that takes the nested value and its corresponding ordering and applies a desired change to them
 * @returns {OrderedObject} - A new OrderedObject with the change applied
 */
function mutateNestedValue(path, operation) {
    const newData = _.cloneDeep(this._data);
    const newOrdering = _.cloneDeep(this._ordering);
    path = _.clone(path);

    function inner(data, ordering, nestedPath) {
        if (!_.isEmpty(nestedPath)) {
            const key = nestedPath.shift();
            inner(data[key], ordering[key], nestedPath);
        } else {
            operation(data, ordering);
        }
    }
    inner(newData, newOrdering, path);
    return new OrderedObject(newData, newOrdering);
}

export default class OrderedObject {
    constructor(data, ordering) {
        this._data = data ? data : {};
        this._ordering = ordering ? ordering : this.orderingFromData(data);
        Object.freeze(this._ordering);
        Object.freeze(this._data);
        buildSubObjects(this, this._data, this._ordering);
    }

    /**
     * Swap two properties at order indices index1 and index2 in a desired sub-object with each other
     * @param index1 - A numeric zero based index
     * @param index2 - A numeric zero based index
     * @param path - A path to the desired sub-object in array format
     * @returns {OrderedObject}
     */
    swap(index1, index2, path = []) {
        path = _.clone(path);
        function operation(_value, ordering) {
            const temp = ordering.order[index1];
            ordering.order[index1] = ordering.order[index2];
            ordering.order[index2] = temp;
        }
        return mutateNestedValue.call(this, path, operation.bind(this));
    }

    /**
     * Update a nested value
     * @param value - The updated value
     * @param path - The path to the value
     * @returns {OrderedObject}
     */
    update(value, path = []) {
        path = _.clone(path);
        const key = path.pop();
        function operation(data, ordering) {
            data[key] = value;
            delete ordering[key];
            if (_.isObjectLike(value))
                ordering[key] = this.orderingFromData(value);
        }
        return mutateNestedValue.call(this, path, operation.bind(this));
    }

    /**
     * Map over the properties of this OrderedObject
     * @param iteratee - Function to apply to each property
     * @returns {OrderedObject}
     */
    map(iteratee) {
        return this._ordering.order.map((key, index) => {
                return iteratee(this._data[key], key, index);
    });
    }

    /**
     * Add a property to the OrderedObject at path, placed last in its ordering
     * @returns {OrderedObject}
     */
    append(key, value, path = []) {
        path = _.clone(path);
        function operation(data, ordering) {
            data[key] = value;
            ordering.order.push(key);
            if (_.isObjectLike(value))
                ordering[key] = this.orderingFromData(value);
        }
        return mutateNestedValue.call(this, path, operation.bind(this));
    }

    /**
     * Add a property to the OrderedObject at path, placed first in its ordering
     * @returns {OrderedObject}
     */
    prepend(key, value, path = []) {
        path = _.clone(path);
        function operation(data, ordering) {
            data[key] = value;
            ordering.order.unshift(key);
            if (_.isObjectLike(value))
                ordering[key] = this.orderingFromData(value);
        }
        return mutateNestedValue.call(this, path, operation.bind(this));
    }

    /**
     * Remove the value found at path
     * @param path
     * @returns {OrderedObject}
     */
    remove(path = []) {
        path = _.clone(path);
        const key = path.pop();
        function operation(data, ordering) {
            delete data[key];
            delete ordering[key];
            _.remove(ordering.order, item => item === key);
        }
        return mutateNestedValue.call(this, path, operation.bind(this));
    }

    getOrdering() {
        return this._ordering;
    }

    getOrder() {
        return this._ordering.order;
    }

    getData() {
        return this._data;
    }

    /**
     * Returns an ordered JSON string representation of this OrderedObject
     * @returns {string}
     */
    stringify() {
        const orderMap = new Map();

        function mapOrdering(order, obj) {
            order.map((key, index) => {
                orderMap.set(JSON.stringify(obj[key]), index);
        });
        }

        function inner(data, ordering) {
            _.map(ordering, (value, key) => {
                if (_.isObjectLike(value) && !_.isArray(value))
            inner(data[key], value);
            if (value.order)
                mapOrdering(value.order, data[key]);
        });
        }

        inner(this._data, this._ordering);

        return stableStringify(this._data, (a, b) => {
                return orderMap.get(JSON.stringify(a.value)) > orderMap.get(JSON.stringify(b.value)) ? 1 : -1;
    });
    }

    /**
     * Constructs a recursive ordering from a given data object
     * @param data
     * @returns {Object}
     */
    orderingFromData(data) {
        const ordering = {};

        if (_.isArray(data)) {
            data.map((value, index) => {
                if (_.isObjectLike(value) && !_.isArray(value))
            ordering[index] = this.orderingFromData(value);
        });
        } else if (_.isObjectLike(data)) {
            const orderArray = [];
            _.map(data, (value, key) => {
                if (_.isObjectLike(value) && !_.isArray(value))
            ordering[key] = this.orderingFromData(value);
            orderArray.push(key);
        });
            ordering.order = orderArray;
        }
        return ordering;
    }
}
