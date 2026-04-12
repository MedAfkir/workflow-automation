package com.afkir.workflow.app.trigger;

import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.trigger.Trigger;
import com.afkir.workflow.domain.trigger.TriggerRepository;
import com.afkir.workflow.domain.workflow.Workflow;
import com.afkir.workflow.domain.workflow.WorkflowRevision;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class TriggerSyncService {

    private final TriggerRepository repository;
    private final SecureRandom random = new SecureRandom();

    public TriggerSyncService(TriggerRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void synchronize(Workflow workflow, WorkflowRevision revision) {
        repository.findByWorkflowId(workflow.id()).forEach(t -> {
            if (t.enabled()) {
                repository.save(t.disabled());
            }
        });

        for (TaskDefinition def : revision.definition().triggers()) {
            var trigger = new Trigger(
                    UUID.randomUUID(),
                    workflow.id(),
                    revision.id(),
                    def.id().value(),
                    def.type(),
                    def.config(),
                    true,
                    computeInitialEvaluation(def),
                    null,
                    generateWebhookKey(def),
                    null,
                    Instant.now(),
                    Instant.now()
            );
            repository.save(trigger);
        }
    }

    private Instant computeInitialEvaluation(TaskDefinition def) {
        if (def.type().equals("io.workflowplatform.builtin.Schedule")) {
            return Instant.now();
        }
        return null;
    }

    private String generateWebhookKey(TaskDefinition def) {
        if (def.type().equals("io.workflowplatform.builtin.Webhook")) {
            var bytes = new byte[24];
            random.nextBytes(bytes);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        }
        return null;
    }
}
