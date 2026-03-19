import React from "react";


const MLPipelines = () => {
  return (
    <div className="container mt-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h2>Machine Learning Pipelines</h2>
          <p className="text-muted mb-0">
            Runtime inference is served by the Flask API and all application data is stored
            in MongoDB. Offline training, evaluation, and experiment tracking are not wired
            into this UI build.
          </p>
        </div>
      </div>
    </div>
  );
};


export default MLPipelines;
