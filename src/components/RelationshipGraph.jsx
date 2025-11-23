import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';

export const RelationshipGraph = component$(({ relationships, characters }) => {
  const graphContainer = useSignal(null);
  const selectedRelationship = useSignal(null);

  useVisibleTask$(({ track }) => {
    track(() => relationships);
    track(() => characters);
    
    if (!graphContainer.value || relationships.length === 0) return;

    // Simple force-directed graph visualization
    // For a more advanced version, consider using a library like vis-network or d3
    const canvas = graphContainer.value.querySelector('canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = graphContainer.value.clientWidth;
    const height = canvas.height = 600;

    // Create nodes from characters
    const nodes = characters.map((char, idx) => ({
      id: char.id || char.name,
      label: char.name,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
    }));

    // Create edges from relationships
    const edges = relationships.map(rel => ({
      source: rel.char1,
      target: rel.char2,
      strength: rel.strength,
    }));

    // Simple force simulation
    const force = () => {
      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (dist * dist);
          const fx = (dx / dist) * force * 0.01;
          const fy = (dy / dist) * force * 0.01;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source || n.label === edge.source);
        const target = nodes.find(n => n.id === edge.target || n.label === edge.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * 0.01 * edge.strength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });

      // Update positions
      nodes.forEach(node => {
        node.vx *= 0.9; // Damping
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary constraints
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });
    };

    // Render function
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)';
      ctx.lineWidth = 2;
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source || n.label === edge.source);
        const target = nodes.find(n => n.id === edge.target || n.label === edge.target);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - 25);
      });
    };

    // Animation loop
    let animationId;
    const animate = () => {
      force();
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Run simulation for a bit then stop
    setTimeout(() => {
      cancelAnimationFrame(animationId);
      // Final render
      for (let i = 0; i < 100; i++) {
        force();
      }
      render();
    }, 2000);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  });

  return (
    <div class="bg-slate-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Relationship Graph</h2>
      {relationships.length === 0 ? (
        <div class="text-slate-400 text-center py-12">
          No relationships found. Sync a repository to see relationships.
        </div>
      ) : (
        <div 
          ref={graphContainer}
          class="w-full bg-slate-900 rounded-lg overflow-hidden"
          style="height: 600px;"
        >
          <canvas class="w-full h-full"></canvas>
        </div>
      )}
      
      {/* Relationship List */}
      {relationships.length > 0 && (
        <div class="mt-4 space-y-2">
          <h3 class="text-sm font-semibold text-slate-300 mb-2">Relationships</h3>
          <div class="max-h-48 overflow-y-auto space-y-1">
            {relationships.map((rel, idx) => (
              <div
                key={idx}
                onClick$={() => selectedRelationship.value = rel}
                class={`bg-slate-700 hover:bg-slate-600 p-2 rounded cursor-pointer transition-colors ${
                  selectedRelationship.value === rel ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm">
                    <span class="font-medium">{rel.char1}</span>
                    <span class="text-slate-400 mx-2">↔</span>
                    <span class="font-medium">{rel.char2}</span>
                  </span>
                  <span class="text-xs text-purple-300 bg-purple-900/50 px-2 py-1 rounded">
                    Strength: {rel.strength}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});




