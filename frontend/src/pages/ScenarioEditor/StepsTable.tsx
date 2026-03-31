import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table, ActionIcon, Group, Badge, Tooltip, Text } from '@mantine/core';
import { IconGripVertical, IconPencil, IconCopy, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { modals } from '@mantine/modals';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { reorderSteps, removeStep, addStep } from '@/store/slices/editorSlice';
import { usePermissions } from '@/hooks/usePermissions';
import type { Step } from '@/types';
import { v4Fallback } from './idUtils';

interface SortableRowProps {
  step: Step;
  index: number;
  onEdit: (step: Step) => void;
  onDuplicate: (step: Step) => void;
  onDelete: (stepId: string) => void;
  canEdit: boolean;
}

function SortableRow({ step, index, onEdit, onDuplicate, onDelete, canEdit }: SortableRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Table.Tr ref={setNodeRef} style={style}>
      <Table.Td>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          style={{ cursor: 'grab' }}
          {...attributes}
          {...listeners}
        >
          <IconGripVertical size={14} />
        </ActionIcon>
      </Table.Td>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>
        <Text size="sm" ff="monospace">{step.id}</Text>
      </Table.Td>
      <Table.Td>
        <Text
          size="sm"
          fw={500}
          style={{ cursor: 'pointer' }}
          onClick={() => onEdit(step)}
          c="cyan"
        >
          {step.name || '(unnamed)'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" size="xs">{t(`editor:action_types.${step.action.type}`)}</Badge>
      </Table.Td>
      <Table.Td>
        {step.depends_on.length > 0
          ? step.depends_on.map((d) => (
              <Badge key={d} size="xs" variant="outline" mr={4}>
                {d}
              </Badge>
            ))
          : <Text size="xs" c="dimmed">—</Text>
        }
      </Table.Td>
      <Table.Td>
        <Badge
          size="xs"
          color={step.on_fail === 'stop' ? 'red' : step.on_fail === 'continue' ? 'green' : 'yellow'}
          variant="light"
        >
          {step.on_fail}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Tooltip label={t('actions.edit')}>
            <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(step)}>
              <IconPencil size={14} />
            </ActionIcon>
          </Tooltip>
          {canEdit && (
            <>
              <Tooltip label={t('actions.clone')}>
                <ActionIcon variant="subtle" size="sm" color="blue" onClick={() => onDuplicate(step)}>
                  <IconCopy size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('actions.delete')}>
                <ActionIcon variant="subtle" size="sm" color="red" onClick={() => onDelete(step.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

export function StepsTable() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const steps = useAppSelector((s) => s.editor.steps);
  const { canEdit } = usePermissions();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      dispatch(reorderSteps(arrayMove(steps, oldIndex, newIndex)));
    }
  };

  const handleEdit = (step: Step) => {
    modals.openContextModal({
      modal: 'stepEditor',
      title: t('editor:step_modal.title_edit'),
      size: 'xl',
      innerProps: { step, isNew: false },
    });
  };

  const handleDuplicate = (step: Step) => {
    const newId = `${step.id}_copy_${v4Fallback()}`;
    dispatch(addStep({ ...step, id: newId, name: `${step.name} (copy)` }));
  };

  const handleDelete = (stepId: string) => {
    dispatch(removeStep(stepId));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}></Table.Th>
              <Table.Th w={40}>{t('editor:steps_table.order')}</Table.Th>
              <Table.Th>{t('editor:steps_table.id')}</Table.Th>
              <Table.Th>{t('editor:steps_table.name')}</Table.Th>
              <Table.Th>{t('editor:steps_table.action_type')}</Table.Th>
              <Table.Th>{t('editor:steps_table.depends_on')}</Table.Th>
              <Table.Th>{t('editor:steps_table.on_fail')}</Table.Th>
              <Table.Th>{t('editor:steps_table.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <Table.Tbody>
              {steps.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8} ta="center">
                    <Text c="dimmed" py="xl">
                      No steps yet. Add a step to get started.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                steps.map((step, i) => (
                  <SortableRow
                    key={step.id}
                    step={step}
                    index={i}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    canEdit={canEdit}
                  />
                ))
              )}
            </Table.Tbody>
          </SortableContext>
        </Table>
      </Table.ScrollContainer>
    </DndContext>
  );
}
