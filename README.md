# OrderedObject

So this is more of a fun one, but seems to work surprisingly well for most implementations. At least the Chrome engine, Node.js and Rails JSON module seem to respect the ordering of serialized JSON.

The basic idea here is to keep track of the ordering of the keys in JS Objects, and to respect that ordering when serializing the structure with ```stringify```. We can also perform re-ordering operations on the OrderedObject, append, prepend etc.
