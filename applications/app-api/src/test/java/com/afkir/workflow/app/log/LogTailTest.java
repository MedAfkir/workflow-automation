package com.afkir.workflow.app.log;

import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.execution.ExecutionState;
import com.afkir.workflow.domain.log.LogEvent;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.infra.persistence.log.LogQueryService;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LogTailTest {

    private static final Duration POLL = Duration.ofMillis(5);
    private static final Duration HEARTBEAT = Duration.ofMillis(40);

    private final LogQueryService logQueryService = mock(LogQueryService.class);
    private final ExecutionRepository executionRepository = mock(ExecutionRepository.class);
    private final LogTail tail = new LogTail(logQueryService, executionRepository, POLL, HEARTBEAT);
    private final ExecutionId executionId = ExecutionId.generate();
    private final RecordingOutput output = new RecordingOutput();

    @Test
    void shouldEmitBacklogThenNewLinesThenEndOnceTerminal() throws Exception {
        when(logQueryService.findSince(executionId, 0L)).thenReturn(List.of(line(1), line(2)));
        when(logQueryService.findSince(executionId, 2L)).thenReturn(List.of(line(3))).thenReturn(List.of());
        when(logQueryService.findSince(executionId, 3L)).thenReturn(List.of());
        when(executionRepository.findById(executionId))
                .thenReturn(Optional.of(execution(ExecutionState.SUCCESS)));

        tail.run(executionId, 0L, output);

        assertThat(output.ids()).containsExactly(1L, 2L, 3L);
        assertThat(output.ended).isTrue();
        assertThat(output.heartbeats).isZero();
    }

    @Test
    void shouldResumeFromLastEventId() throws Exception {
        when(logQueryService.findSince(executionId, 7L)).thenReturn(List.of(line(8))).thenReturn(List.of());
        when(logQueryService.findSince(executionId, 8L)).thenReturn(List.of());
        when(executionRepository.findById(executionId))
                .thenReturn(Optional.of(execution(ExecutionState.FAILED)));

        tail.run(executionId, 7L, output);

        assertThat(output.ids()).containsExactly(8L);
        verify(logQueryService, never()).findSince(executionId, 0L);
    }

    @Test
    void shouldDeliverLinesFlushedAfterTerminalState() throws Exception {
        when(logQueryService.findSince(executionId, 0L)).thenReturn(List.of()).thenReturn(List.of(line(1)));
        when(logQueryService.findSince(executionId, 1L)).thenReturn(List.of());
        when(executionRepository.findById(executionId))
                .thenReturn(Optional.of(execution(ExecutionState.SUCCESS)));

        tail.run(executionId, 0L, output);

        assertThat(output.ids()).containsExactly(1L);
        assertThat(output.ended).isTrue();
        verify(executionRepository, times(2)).findById(executionId);
    }

    @Test
    void shouldRereadImmediatelyAfterFullPage() throws Exception {
        var fullPage = LongStream.rangeClosed(1, LogQueryService.PAGE_SIZE).mapToObj(LogTailTest::line).toList();
        when(logQueryService.findSince(executionId, 0L)).thenReturn(fullPage);
        when(logQueryService.findSince(executionId, (long) LogQueryService.PAGE_SIZE))
                .thenReturn(List.of(line(LogQueryService.PAGE_SIZE + 1))).thenReturn(List.of());
        when(logQueryService.findSince(executionId, LogQueryService.PAGE_SIZE + 1L)).thenReturn(List.of());
        when(executionRepository.findById(executionId))
                .thenReturn(Optional.of(execution(ExecutionState.SUCCESS)));

        tail.run(executionId, 0L, output);

        assertThat(output.ids()).hasSize(LogQueryService.PAGE_SIZE + 1);
        assertThat(output.ids().getLast()).isEqualTo(LogQueryService.PAGE_SIZE + 1L);
        assertThat(output.ended).isTrue();
    }

    @Test
    void shouldEndStreamWhenExecutionIsUnknown() throws Exception {
        when(logQueryService.findSince(executionId, 0L)).thenReturn(List.of());
        when(executionRepository.findById(executionId)).thenReturn(Optional.empty());

        tail.run(executionId, 0L, output);

        assertThat(output.ids()).isEmpty();
        assertThat(output.ended).isTrue();
    }

    @Test
    void shouldSendHeartbeatWhileIdleAndStopWhenOutputCloses() throws Exception {
        when(logQueryService.findSince(executionId, 0L)).thenReturn(List.of());
        when(executionRepository.findById(executionId))
                .thenReturn(Optional.of(execution(ExecutionState.RUNNING)));
        output.closeOnHeartbeat = true;

        tail.run(executionId, 0L, output);

        assertThat(output.heartbeats).isEqualTo(1);
        assertThat(output.ended).isFalse();
    }

    private static LogEvent line(long id) {
        return new LogEvent(id, ExecutionId.generate(), UUID.randomUUID(), "INFO", "line " + id, Instant.now());
    }

    private static Execution execution(ExecutionState state) {
        return Execution.create(WorkflowId.generate(), UUID.randomUUID(), "MANUAL", null, Map.of())
                .withState(state);
    }

    private static final class RecordingOutput implements LogStreamOutput {
        private final List<LogEvent> logs = new ArrayList<>();
        private boolean open = true;
        private boolean ended;
        private int heartbeats;
        private boolean closeOnHeartbeat;

        @Override
        public boolean isOpen() {
            return open;
        }

        @Override
        public void log(LogEvent event) {
            logs.add(event);
        }

        @Override
        public void heartbeat() {
            heartbeats++;
            if (closeOnHeartbeat) open = false;
        }

        @Override
        public void end() {
            ended = true;
        }

        List<Long> ids() {
            return logs.stream().map(LogEvent::id).toList();
        }
    }
}
