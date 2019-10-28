import * as _ from "lodash";

export default function applyReducers(root) {
  root.collectionNodes.forEach(node => {
    applyReducers(node);
  });

  const processedReducers = [];
  const reducersQueue = [...root.reducerNodes];

  // TODO: find out if there's an infinite reducer inter-dependency
  while (reducersQueue.length) {
    const reducerNode = reducersQueue.shift();

    // If this reducer depends on other reducers
    if (reducerNode.dependencies.length) {
      // If there is an unprocessed reducer, move it at the end of the queue
      const allDependenciesComputed = _.every(reducerNode.dependencies, dep =>
        processedReducers.includes(dep)
      );
      if (allDependenciesComputed) {
        root.results.forEach(result => {
          reducerNode.compute(result);
        });
        processedReducers.push(reducerNode.name);
      } else {
        // Move it at the end of the queue
        reducersQueue.push(reducerNode);
      }
    } else {
      root.results.forEach(result => {
        reducerNode.compute(result);
      });

      processedReducers.push(reducerNode);
    }
  }
}
