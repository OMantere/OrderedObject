# OrderedObject

The basic idea here is to keep track of the ordering of the keys in JS Objects, and to respect that ordering when serializing the structure with ```stringify```. We can also perform re-ordering operations on the OrderedObject, append, prepend etc.

## Usage

Construct a new OrderedObject and have its ordering inferred from the data: ```orderedObject = new OrderedObject(nativeObject)```

Suppose ```nativeObject = { child1: { nestedChild1: { prop1: 1337 }, nestedChild2: 'yay!' }, child2: 'cool' }```

&nbsp;

OrderedObjects are recursive. For example, ```orderedObject.child1``` will return the ordered object of ```child1```

And you can call all the usual methods on ```child1```, like map, swap, append.

&nbsp;

Get the order of a single OrderedObject: ```orderedObject.child1.getOrder()```.

Get the recursive object representing the order for the whole OrderedObject: ```orderedObject.child1.getOrdering()```.

&nbsp;

OrderedObjects are immutable. This means that every mutating operation will return a new OrderedObject. So for example, to remove ```prop1```, you would say ```orderedObject = orderedObject.remove(['child1', 'nestedChild', 'prop1'])```

Most of the time you want to return the root object from a mutable operation. Then you need to use paths, like in the previous example.

Another example: swap the order of the two props of ```child1```: ```orderedObject = orderedObject.swap(0, 1, ['child1'])```

&nbsp;

Mapping over the properties of ```child1```:

~~~~
orderedObject.map((value, key, index) => {
    console.log('Hi!, I am property ' + key + ' with the value ' + value + ', the ' + index + '-th property in child1!');
})
~~~~

&nbsp;

```orderedObject.stringify()``` returns the object stringified to JSON with all the keys ordered.

&nbsp;

## API

~~~~
/**
 * Swap two properties at order indices index1 and index2 in a desired sub-object with each other
 * @param index1 - A numeric zero based index
 * @param index2 - A numeric zero based index
 * @param path - A path to the desired sub-object in array format
 * @returns {OrderedObject}
 */
swap(index1, index2, path = [])

/**
 * Update a nested value
 * @param value - The updated value
 * @param path - The path to the value
 * @returns {OrderedObject}
 */
update(value, path = [])

/**
 * Map over the properties of this OrderedObject
 * @param iteratee - Function to apply to each property
 * @returns {OrderedObject}
 */
map(iteratee)

/**
 * Add a property to the OrderedObject at path, placed last in its ordering
 * @returns {OrderedObject}
 */
append(key, value, path = [])

/**
 * Add a property to the OrderedObject at path, placed first in its ordering
 * @returns {OrderedObject}
 */
prepend(key, value, path = [])

/**
 * Remove the value found at path
 * @param path
 * @returns {OrderedObject}
 */
remove(path = [])

getOrdering()

getOrder()

getData()

/**
 * Returns an ordered JSON string representation of this OrderedObject
 * @returns {string}
 */
stringify() {
~~~~
