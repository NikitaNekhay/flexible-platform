import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
} from '@xyflow/react';
import dagre from 'dagre';
import { Box, Collapse, Button, Group, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { modals } from '@mantine/modals';
import { useAppSelector } from '@/store/hooks';
import type { Step } from '@/types';

import '@xyflow/react/dist/style.css';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

function buildLayout(steps: Step[], cycleNodeIds: Set<string>) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 80 });

  for (const step of steps) {
    g.setNode(step.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges: Edge[] = [];
  for (const step of steps) {
    for (const dep of step.depends_on) {
      if (steps.some((s) => s.id === dep)) {
        g.setEdge(dep, step.id);
        edges.push({
          id: `${dep}->${step.id}`,
          source: dep,
          target: step.id,
          animated: true,
          style: { stroke: cycleNodeIds.has(dep) && cycleNodeIds.has(step.id) ? '#fa5252' : '#4dabf7' },
        });
      }
    }
  }

  dagre.layout(g);

  const nodes: Node[] = steps.map((step) => {
    const pos = g.node(step.id);
    const isCycleNode = cycleNodeIds.has(step.id);
    return {
      id: step.id,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { label: step.name || step.id, actionType: step.action.type },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: isCycleNode ? '#2c1519' : '#1a1b1e',
        border: `1px solid ${isCycleNode ? '#fa5252' : '#373a40'}`,
        borderRadius: 8,
        color: '#c1c2c5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        padding: 8,
      },
    };
  });

  return { nodes, edges };
}

export function DAGViewer() {
  const { t } = useTranslation();
  const [opened, { toggle }] = useDisclosure(true);
  const steps = useAppSelector((s) => s.editor.steps);
  const validation = useAppSelector((s) => s.editor.validationState);

  const cycleNodeIds = useMemo(() => new Set(validation.cycleNodes), [validation.cycleNodes]);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(steps, cycleNodeIds),
    [steps, cycleNodeIds],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // Sync layout when steps change
  useMemo(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const step = steps.find((s) => s.id === node.id);
      if (step) {
        modals.openContextModal({
          modal: 'stepEditor',
          title: t('editor:step_modal.title_edit'),
          size: 'xl',
          innerProps: { step, isNew: false },
        });
      }
    },
    [steps, t],
  );

  if (steps.length === 0) return null;

  return (
    <Box mt="md">
      <Group gap="xs" mb="xs">
        <Button
          variant="subtle"
          size="compact-sm"
          rightSection={opened ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          onClick={toggle}
        >
          {t('editor:dag_viewer.title')}
        </Button>
        <Badge size="xs" variant="light">
          {steps.length} {t('editor:dag_viewer.nodes')}
        </Badge>
      </Group>

      <Collapse in={opened}>
        <Box
          className="react-flow-container"
          style={{
            height: 400,
            border: '1px solid var(--mantine-color-dark-4)',
            borderRadius: 8,
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#373a40" gap={16} />
            <Controls />
          </ReactFlow>
        </Box>
      </Collapse>
    </Box>
  );
}
