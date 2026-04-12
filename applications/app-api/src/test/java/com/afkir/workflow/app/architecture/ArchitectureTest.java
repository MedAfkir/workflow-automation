package com.afkir.workflow.app.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;

@AnalyzeClasses(
        packages = "com.afkir.workflow",
        importOptions = ImportOption.DoNotIncludeTests.class
)
class ArchitectureTest {

    @ArchTest
    static final ArchRule domain_is_free_of_spring = noClasses()
            .that().resideInAPackage("com.afkir.workflow.domain..")
            .should().dependOnClassesThat().resideInAPackage("org.springframework..")
            .because("the domain must remain framework-free (modular monolith principle)");

    @ArchTest
    static final ArchRule plugin_sdk_does_not_depend_on_spring = noClasses()
            .that().resideInAPackage("com.afkir.workflow.plugin..")
            .and().resideOutsideOfPackage("..builtin..")
            .should().dependOnClassesThat().resideInAPackage("org.springframework..")
            .because("the plugin SDK core must remain Spring-free; the builtin module is exempt");

    @ArchTest
    static final ArchRule no_field_injection = noFields()
            .should().beAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .because("constructor injection only (final fields, testable, no hidden state)");

    @ArchTest
    static final ArchRule domain_only_uses_jdk = classes()
            .that().resideInAPackage("com.afkir.workflow.domain..")
            .should().onlyDependOnClassesThat()
            .resideInAnyPackage("java..", "com.afkir.workflow.domain..")
            .because("the domain layer must be self-contained and rely only on the JDK");

    @ArchTest
    static final ArchRule engine_does_not_depend_on_infra = noClasses()
            .that().resideInAPackage("com.afkir.workflow.engine..")
            .should().dependOnClassesThat().resideInAPackage("com.afkir.workflow.infra..")
            .because("the engine must depend on ports, not on infrastructure adapters (ADR 0011)");
}
