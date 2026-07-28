import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput as RNTextInput, Pressable, Modal, Alert } from 'react-native';
import { Text, ActivityIndicator, Button, Checkbox, IconButton, useTheme, List, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useMentions } from 'react-native-controlled-mentions';
import type { TriggersConfig } from 'react-native-controlled-mentions/dist/types/types';
import { workOrdersApi, type WorkOrder, type WorkOrderStatus } from '../../api/workOrders';
import { workOrderExtrasApi, type Comment, type Task, type TimeLog, type AdditionalCost, type WorkOrderFile, type WorkOrderLink } from '../../api/workOrderExtras';
import { useAuth } from '../../context/AuthContext';
import { lookupsApi, type UserSummary } from '../../api/lookups';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ImageView from 'react-native-image-viewing';
import { AudioPlayer } from '../../components/AudioPlayer';

// Igual triggersConfig que el real: "@" abre la mencion, guarda
// @[Nombre](user:id) en el texto guardado.
const triggersConfig: TriggersConfig<'mention'> = {
  mention: {
    trigger: '@',
    pattern: /(@\[[^\]]+\]\(user:[^)]+\))/g,
    isInsertSpaceAfterMention: true,
    textStyle: { fontWeight: 'bold', color: 'blue' },
    getTriggerData: (match: string) => {
      const result = match.match(/@\[(.*?)\]\(user:(.*?)\)/);
      return { original: match, trigger: '@', name: result?.[1] ?? '', id: result?.[2] ?? '' };
    },
    getTriggerValue: (suggestion) => `@[${suggestion.name}](user:${suggestion.id})`,
  },
};

// Muestra un comentario ya guardado con las menciones resaltadas, en vez
// del patron crudo @[Nombre](user:id).
function CommentContent({ content }: { content: string }) {
  const parts = content.split(/(@\[[^\]]+\]\(user:[^)]+\))/g);
  return (
    <Text variant="bodyMedium">
      {parts.map((part, i) => {
        const match = part.match(/@\[(.*?)\]\(user:(.*?)\)/);
        return match ? (
          <Text key={i} style={{ fontWeight: 'bold', color: 'blue' }}>
            @{match[1]}
          </Text>
        ) : (
          part
        );
      })}
    </Text>
  );
}

// Mismo patron que BasicField/ObjectField reales: etiqueta chica gris
// arriba, valor grande en negrita abajo. ObjectField ademas es tocable
// (en el real navega al detalle de esa entidad -- Activo/Ubicacion/Equipo/
// Usuario. Como esas pantallas todavia no existen en nuestra app, queda
// deshabilitado por ahora, disclosed).
function BasicField({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
        {value}
      </Text>
    </View>
  );
}

function ObjectField({ label, value, theme }: { label: string; value: string | number | null | undefined; theme: any }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
        {value}
      </Text>
    </View>
  );
}

const STATUS_FLOW: WorkOrderStatus[] = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En progreso',
  ON_HOLD: 'En espera',
  COMPLETED: 'Completada',
};
const PRIORITY_LABELS: Record<string, string> = {
  NONE: 'Ninguna',
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};
// Copiado exacto de utils/formatters.ts real: "1:01", "4:03:59", "123:03:59".
function durationToHours(durationSeconds: number): string {
  const hrs = Math.trunc(durationSeconds / 3600);
  const mins = Math.trunc((durationSeconds % 3600) / 60);
  const secs = Math.trunc(durationSeconds) % 60;
  let ret = '';
  if (hrs > 0) ret += hrs + ':' + (mins < 10 ? '0' : '');
  ret += mins + ':' + (secs < 10 ? '0' : '');
  ret += secs;
  return ret;
}

export default function WorkOrderDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const theme = useTheme();
  const { userId } = useAuth();

  // Igual que getStatusColor() real (utils/overall.ts).
  const STATUS_COLORS: Record<WorkOrderStatus, string> = {
    OPEN: theme.colors.tertiary,
    IN_PROGRESS: theme.colors.success,
    ON_HOLD: theme.colors.warning,
    COMPLETED: 'black',
  };
  // Igual que getPriorityColor() real.
  const PRIORITY_COLORS: Record<string, string> = {
    NONE: theme.colors.tertiary,
    LOW: theme.colors.info,
    MEDIUM: theme.colors.warning,
    HIGH: theme.colors.error,
  };
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [commentFiles, setCommentFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [costs, setCosts] = useState<AdditionalCost[]>([]);
  const [files, setFiles] = useState<WorkOrderFile[]>([]);
  const [links, setLinks] = useState<WorkOrderLink[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrder[]>([]);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [newComment, setNewComment] = useState('');

  const { textInputProps, triggers } = useMentions({
    value: newComment,
    onChange: setNewComment,
    triggersConfig,
  });
  const mentionKeyword = triggers?.mention?.keyword ?? null;
  const filteredUsers = (mentionKeyword ? users.filter((u) => (u.fullName || u.email).toLowerCase().includes(mentionKeyword.toLowerCase())) : users).map(
    (u) => ({ id: String(u.id), name: u.fullName || u.email }),
  );
  const [updating, setUpdating] = useState(false);
  const [controllingTime, setControllingTime] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveLabel, setLiveLabel] = useState('0:00');

  const load = useCallback(() => {
    setLoadError(null);
    workOrdersApi
      .getById(id)
      .then(setWo)
      .catch((err: any) => setLoadError(err?.response?.data?.message ?? 'No se pudo cargar la orden. Revisá tu conexión.'));
    workOrderExtrasApi.getComments(id).then(setComments).catch(() => {});
    workOrderExtrasApi.getTasks(id).then(setTasks).catch(() => {});
    workOrderExtrasApi.getTimeLogs(id).then(setTimeLogs).catch(() => {});
    workOrderExtrasApi.getCosts(id).then(setCosts).catch(() => {});
    workOrderExtrasApi.getFiles(id).then(setFiles).catch(() => {});
    workOrderExtrasApi.getLinks(id).then(setLinks).catch(() => {});
    workOrdersApi.list(0, 100).then((r) => setAllWorkOrders(r.content.filter((w) => w.id !== id))).catch(() => {});
    lookupsApi.users().then(setUsers).catch(() => {});
  }, [id]);

  useFocusEffect(load);

  // Igual que el real: el cronometro es propio de CADA usuario (no una
  // suma de todos), y muestra el tiempo en vivo, actualizado cada segundo.
  const myLogs = timeLogs.filter((l) => l.userId === userId);
  const myRunningLog = myLogs.find((l) => l.running);
  const myStoppedSeconds = myLogs.filter((l) => !l.running).reduce((sum, l) => sum + (l.hours ?? 0) * 3600, 0);

  useEffect(() => {
    if (!myRunningLog?.startedAt) {
      setLiveLabel('0:00');
      return;
    }
    function update() {
      const elapsed = (Date.now() - new Date(myRunningLog!.startedAt!).getTime()) / 1000;
      setLiveLabel(durationToHours(myStoppedSeconds + elapsed));
    }
    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [myRunningLog?.startedAt, myStoppedSeconds]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        wo && (
          <Pressable onPress={() => setActionsMenuOpen(true)}>
            <IconButton icon="dots-vertical" />
          </Pressable>
        ),
    });
  }, [navigation, wo]);

  function handleEdit() {
    setActionsMenuOpen(false);
    navigation.navigate('AddWorkOrder', { workOrder: wo });
  }

  async function handleArchive() {
    setActionsMenuOpen(false);
    Alert.alert('Archivar orden', '¿Archivar esta orden de trabajo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Archivar',
        onPress: async () => {
          setProcessingAction(true);
          try {
            await workOrdersApi.archive(id);
            navigation.goBack();
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  }

  async function handleDelete() {
    setActionsMenuOpen(false);
    Alert.alert('Eliminar orden', 'Esta acción no se puede deshacer. ¿Eliminar esta orden de trabajo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setProcessingAction(true);
          try {
            await workOrdersApi.delete(id);
            navigation.goBack();
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  }

  async function handleGenerateReport() {
    setActionsMenuOpen(false);
    setGeneratingReport(true);
    try {
      const base64 = await workOrdersApi.downloadReport(id);
      const fileUri = `${FileSystem.cacheDirectory}orden-${wo?.customId ?? id}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
      }
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleTimerToggle() {
    setControllingTime(true);
    try {
      if (myRunningLog) {
        await workOrderExtrasApi.stopTimer(id);
      } else {
        await workOrderExtrasApi.startTimer(id);
      }
      workOrderExtrasApi.getTimeLogs(id).then(setTimeLogs);
      load(); // el timer puede haber pasado la orden a "En progreso"
    } finally {
      setControllingTime(false);
    }
  }

  async function handleStatusChange(status: WorkOrderStatus) {
    if (status === 'COMPLETED' && wo?.requiresSignature) {
      navigation.navigate('CompleteWorkOrder', { id, askFeedback: true, requiresSignature: true });
      return;
    }
    setUpdating(true);
    try {
      setWo(await workOrdersApi.updateStatus(id, status));
    } finally {
      setUpdating(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    // Igual que el real: primero se suben los archivos elegidos, y recien
    // con esos IDs ya subidos se crea el comentario.
    const fileIds: number[] = [];
    for (const asset of commentFiles) {
      const uploaded = await workOrderExtrasApi.uploadFile(id, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });
      fileIds.push(uploaded.id);
    }
    await workOrderExtrasApi.addComment(id, newComment.trim(), fileIds.length ? fileIds : undefined);
    setNewComment('');
    setCommentFiles([]);
    workOrderExtrasApi.getComments(id).then(setComments);
  }

  async function pickCommentFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
    if (!result.canceled && result.assets) {
      setCommentFiles((prev) => [...prev, ...result.assets]);
    }
  }

  function removeCommentFile(index: number) {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleToggleTask(task: Task) {
    await workOrderExtrasApi.updateTask(task.id, { completed: !task.completed });
    workOrderExtrasApi.getTasks(id).then(setTasks);
  }

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingFile(true);
    try {
      await workOrderExtrasApi.uploadFile(id, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });
      workOrderExtrasApi.getFiles(id).then(setFiles);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDeleteFile(fileId: number) {
    await workOrderExtrasApi.deleteFile(id, fileId);
    workOrderExtrasApi.getFiles(id).then(setFiles);
  }

  function handleOpenLinkSelector() {
    const alreadyLinkedIds = links.map((l) => l.workOrderId);
    navigation.navigate('SelectList', {
      title: 'Vincular orden',
      options: allWorkOrders.map((w) => ({ id: w.id, label: w.title, subtitle: `#${w.customId ?? w.id}` })),
      selected: alreadyLinkedIds,
      onChange: async (ids: number[]) => {
        const toAdd = ids.filter((i) => !alreadyLinkedIds.includes(i));
        const toRemove = links.filter((l) => !ids.includes(l.workOrderId));
        for (const linkedId of toAdd) await workOrderExtrasApi.addLink(id, linkedId);
        for (const link of toRemove) await workOrderExtrasApi.removeLink(id, link.linkId);
        workOrderExtrasApi.getLinks(id).then(setLinks);
      },
    });
  }

  async function handleRemoveLink(linkId: number) {
    await workOrderExtrasApi.removeLink(id, linkId);
    workOrderExtrasApi.getLinks(id).then(setLinks);
  }

  if (!wo) {
    if (loadError) {
      return (
        <View style={styles.center}>
          <Text style={{ marginBottom: 12 }}>{loadError}</Text>
          <Button mode="contained" onPress={load}>
            Reintentar
          </Button>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const totalCost = costs.reduce((sum, c) => sum + (c.cost ?? 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall">{wo.title}</Text>
        <View style={styles.idPriorityRow}>
          <Text variant="titleMedium" style={{ marginRight: 10, color: 'grey' }}>
            #{wo.customId ?? wo.id}
          </Text>
          {wo.priority !== 'NONE' && (
            <Text style={{ color: PRIORITY_COLORS[wo.priority], fontWeight: 'bold' }}>Prioridad {PRIORITY_LABELS[wo.priority]}</Text>
          )}
        </View>

        <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.statusField, { borderColor: STATUS_COLORS[wo.status] }]}
          onPress={() => setStatusMenuOpen(true)}
        >
          <Text style={{ color: STATUS_COLORS[wo.status] }}>{STATUS_LABELS[wo.status]}</Text>
          <IconButton iconColor={STATUS_COLORS[wo.status]} icon="menu-down" size={24} style={{ margin: -5 }} />
        </TouchableOpacity>
        <Modal visible={statusMenuOpen} transparent animationType="slide" onRequestClose={() => setStatusMenuOpen(false)}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setStatusMenuOpen(false)}>
            <View style={styles.sheet}>
              {STATUS_FLOW.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.sheetItem}
                  onPress={() => {
                    setStatusMenuOpen(false);
                    if (status !== wo.status) handleStatusChange(status);
                  }}
                >
                  <Text style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
        </View>

        <BasicField label="Descripción" value={wo.description} />
        <BasicField label="Fecha de vencimiento" value={wo.dueDate ? new Date(wo.dueDate).toLocaleString() : null} />
        <BasicField label="Fecha de inicio prevista" value={wo.estimatedStartDate ? new Date(wo.estimatedStartDate).toLocaleString() : null} />
        <BasicField
          label="Duración estimada"
          value={wo.estimatedDurationMinutes ? `${(wo.estimatedDurationMinutes / 60).toFixed(1)} horas` : null}
        />
        <BasicField label="Categoría" value={wo.categoryName} />
        <BasicField label="Fecha de creación" value={new Date(wo.createdAt).toLocaleString()} />

        <ObjectField label="Activo" value={wo.assetName} theme={theme} />
        <ObjectField label="Ubicación" value={wo.locationName} theme={theme} />
        <ObjectField label="Equipo" value={wo.teamName} theme={theme} />
        <ObjectField label="Trabajador principal" value={wo.primaryAssigneeName} theme={theme} />
        <ObjectField label="Creado por" value={wo.createdByName} theme={theme} />

        {wo.status === 'COMPLETED' && (
          <View>
            <ObjectField label="Completado por" value={wo.completedByName} theme={theme} />
            <BasicField label="Completado el" value={wo.completedAt ? new Date(wo.completedAt).toLocaleString() : null} />
            <BasicField label="Comentario de cierre" value={wo.feedback} />
            {wo.signature && (
              <View style={{ marginTop: 20 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  Firma
                </Text>
                <Text variant="bodyMedium">{wo.signature}</Text>
              </View>
            )}
          </View>
        )}

        {wo.assignees && wo.assignees.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Asignado a</Text>
            {wo.assignees.map((a) => (
              <Text key={a.id} variant="bodyLarge" style={{ marginTop: 8 }}>
                {a.fullName}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.shadowedCard}>
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Tareas ({tasks.filter((t) => t.completed).length}/{tasks.length})
        </Text>
        {tasks.length === 0 ? (
          <Text variant="bodySmall" style={styles.muted}>
            Sin tareas en esta orden.
          </Text>
        ) : (
          tasks.map((task) => (
            <List.Item
              key={task.id}
              title={task.label}
              left={() => <Checkbox status={task.completed ? 'checked' : 'unchecked'} onPress={() => handleToggleTask(task)} />}
              onPress={() => handleToggleTask(task)}
              style={{ paddingVertical: 0 }}
            />
          ))
        )}
        </View>

        <View style={styles.shadowedCard}>
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Costos adicionales — ${totalCost.toFixed(2)} en total
        </Text>
        {costs.length === 0 ? (
          <Text variant="bodySmall" style={styles.muted}>
            Sin costos cargados.
          </Text>
        ) : (
          costs.map((c) => (
            <View key={c.id} style={styles.costRow}>
              <Text variant="bodyMedium">{c.description}</Text>
              <Text variant="bodyMedium">${c.cost.toFixed(2)}</Text>
            </View>
          ))
        )}
        </View>

        <View style={styles.shadowedCard}>
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Archivos ({files.length})
        </Text>
        {files.map((f, index) => {
          const isImage = f.contentType?.startsWith('image/');
          return (
            <TouchableOpacity key={f.id} disabled={!isImage} onPress={() => setViewingImageIndex(files.filter((x) => x.contentType?.startsWith('image/')).findIndex((x) => x.id === f.id))}>
              <View style={styles.fileRow}>
                <IconButton icon={isImage ? 'image-outline' : 'file-outline'} size={20} style={styles.iconBtnTight} />
                <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                  {f.fileName}
                </Text>
                <IconButton icon="delete-outline" size={18} onPress={() => handleDeleteFile(f.id)} />
              </View>
            </TouchableOpacity>
          );
        })}
        <Button icon="paperclip" mode="outlined" onPress={handlePickFile} loading={uploadingFile} disabled={uploadingFile} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          Adjuntar archivo
        </Button>
        </View>

        <View style={styles.shadowedCard}>
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Vínculos ({links.length})
        </Text>
        {links.map((l) => (
          <View key={l.linkId} style={styles.fileRow}>
            <IconButton icon="link-variant" size={20} style={styles.iconBtnTight} />
            <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
              {l.title} (#{l.workOrderId})
            </Text>
            <IconButton icon="delete-outline" size={18} onPress={() => handleRemoveLink(l.linkId)} />
          </View>
        ))}
        <View style={styles.commentInputRow}>
          <Button icon="link-plus" mode="outlined" onPress={handleOpenLinkSelector}>
            Vincular orden
          </Button>
        </View>
        </View>

        <View style={styles.shadowedCard}>
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Comentarios ({comments.length})
        </Text>
        {comments.map((c) => (
          <View key={c.id} style={styles.commentBox}>
            <Text variant="bodySmall" style={{ fontWeight: 'bold' }}>
              {c.authorName ?? 'Usuario'}
            </Text>
            <CommentContent content={c.content} />
            {c.files.map((f) =>
              f.contentType?.startsWith('audio/') ? (
                <View key={f.id} style={styles.fileRow}>
                  <AudioPlayer url={f.downloadUrl} />
                  <Text variant="bodySmall" style={styles.muted}>
                    {f.fileName}
                  </Text>
                </View>
              ) : (
                <View key={f.id} style={styles.fileRow}>
                  <IconButton icon="file-outline" size={18} style={styles.iconBtnTight} />
                  <Text variant="bodySmall" style={styles.muted}>
                    {f.fileName}
                  </Text>
                </View>
              ),
            )}
            <Text variant="bodySmall" style={styles.muted}>
              {new Date(c.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}
        {mentionKeyword !== null && filteredUsers.length > 0 && (
          <View style={styles.mentionSuggestions}>
            {filteredUsers.map((item) => (
              <Pressable key={item.id} onPress={() => triggers?.mention?.onSelect?.(item)} style={styles.mentionItem}>
                <Text>{item.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {commentFiles.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            {commentFiles.map((file, index) => (
              <View key={index} style={styles.fileRow}>
                <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={1}>
                  {file.name}
                </Text>
                <IconButton icon="close" size={16} onPress={() => removeCommentFile(index)} />
              </View>
            ))}
          </View>
        )}
        <View style={styles.commentInputRow}>
          <RNTextInput
            multiline
            placeholder="Escribir un comentario… (@ para mencionar)"
            style={styles.mentionInput}
            {...textInputProps}
          />
          <IconButton icon="paperclip" onPress={pickCommentFile} />
          <IconButton icon="send" onPress={handleAddComment} disabled={!newComment.trim()} />
        </View>
        </View>
      </ScrollView>

      <Modal visible={actionsMenuOpen} transparent animationType="slide" onRequestClose={() => setActionsMenuOpen(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setActionsMenuOpen(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity style={styles.sheetItem} onPress={handleEdit}>
              <Text>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleGenerateReport} disabled={generatingReport}>
              <Text>{generatingReport ? 'Generando reporte…' : 'Generar reporte'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleArchive} disabled={processingAction}>
              <Text>Archivar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleDelete} disabled={processingAction}>
              <Text style={{ color: theme.colors.error }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ImageView
        images={files.filter((f) => f.contentType?.startsWith('image/')).map((f) => ({ uri: f.downloadUrl }))}
        imageIndex={viewingImageIndex ?? 0}
        visible={viewingImageIndex !== null}
        onRequestClose={() => setViewingImageIndex(null)}
      />

      {/* FAB flotante del cronometro -- igual que el real: el label muestra
          el tiempo EN VIVO si esta corriendo, o el acumulado del usuario
          si no. Es propio de cada usuario, no una suma de todos. */}
      <FAB
        icon={myRunningLog ? 'stop' : 'play'}
        label={myRunningLog ? liveLabel : durationToHours(myStoppedSeconds)}
        disabled={controllingTime}
        color="white"
        style={[styles.fab, { backgroundColor: myRunningLog ? theme.colors.error : theme.colors.primary }]}
        onPress={handleTimerToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#6B7280' },
  description: { marginTop: 12 },
  // Copiado exacto de AdditionalCostsCard.tsx real (shadowedCard).
  shadowedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    marginVertical: 10,
    marginHorizontal: 5,
    elevation: 5,
  },
  sectionLabel: { marginBottom: 10 },
  idPriorityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderRadius: 4 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingVertical: 8 },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  commentBox: { backgroundColor: '#F2F4F9', borderRadius: 8, padding: 10, marginBottom: 8 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtnTight: { margin: 0 },
  mentionSuggestions: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    marginBottom: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  mentionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mentionInput: { flex: 1, borderWidth: 1, borderColor: '#D9DCE3', borderRadius: 6, padding: 10, minHeight: 44 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
