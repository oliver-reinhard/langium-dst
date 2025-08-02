import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { Activity, ActivityClause, Connector, DeclarationScope, Icon, isAgentDeclaration, isFootnote, isWorkObjectDeclaration, Story, type DomainStorytellingAstType, type ResourceDeclaration } from './generated/ast.js';
import type { DomainStorytellingServices } from './domain-storytelling-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: DomainStorytellingServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DomainStorytellingValidator;
    const checks: ValidationChecks<DomainStorytellingAstType> = {
        DeclarationScope: validator.checkUniqueResourceDeclarationName,
        Story: [
            validator.checkResourceDeclarationOverride,
            validator.checkFootnoteNumbersUnique,
            validator.checkUnreferencedFootnotes
        ],
        ResourceDeclaration: validator.checkResourceDeclarationStartsWithUpper,
        Activity: validator.checkNoIntermediateAgents,
        ActivityClause: validator.checkMultipleRecipients,
        Connector: validator.checkConnectorStartsWithLower,
        Icon: validator.checkIconDefinitionStartsWithUpper
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class DomainStorytellingValidator {
    checkUniqueResourceDeclarationName(scope: DeclarationScope, accept: ValidationAcceptor): void {
        const reported = new Set();
        scope.declarations.forEach(decl => {
            if (reported.has(decl.name)) {
                accept('error', `An agent or work object named '${decl.name}' is already declared in this story.`, {node: decl, property: 'name'});
            }
            reported.add(decl.name);
        });
    }

    checkResourceDeclarationOverride(story: Story, accept: ValidationAcceptor): void {
        const book = story.book?.ref;
        if (book != null) {
            const bookResourceNames = new Set(book.declarations.map((decl) => decl.name));
            story.declarations.forEach(decl => {
                if (bookResourceNames.has(decl.name)) {
                    accept('error', `An agent or work object named '${decl.name}' is already declared in book '${book.name}'.`, {node: decl, property: 'name'});
                }
            });
        }
    }

    checkFootnoteNumbersUnique(story:Story, accept: ValidationAcceptor): void {
        const reported = new Set();
        story.footnotes.forEach(note => {
            if (reported.has(note.name)) {
                accept('error', `Duplicate footnote index '${note.name}'.`, {node: note, property: 'name'});
            }
            reported.add(note.name);
        });
    }

    checkUnreferencedFootnotes(story:Story, accept: ValidationAcceptor): void {
        const allReferences = story.$document?.references;
        if (allReferences != null) {
            const allFootnotes = new Set(story.footnotes);
            for (let ref of allReferences) {
                const node = ref.$nodeDescription?.node;
                if (isFootnote(node)) {
                    allFootnotes.delete(node);
                }
            }
            for(let footnote of allFootnotes) {
                accept('warning', `Unreferenced footnote '${footnote.name}'.`, {node: footnote, property: 'name'});
            }
        }
    }

    checkIconDefinitionStartsWithUpper(icon: Icon, accept: ValidationAcceptor): void {
        if (icon.name) {
            const firstChar = icon.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Icon names should start with an uppercase letter.', { node: icon, property: 'name' });
            }
        }
    }

    checkResourceDeclarationStartsWithUpper(resource: ResourceDeclaration, accept: ValidationAcceptor): void {
        if (resource.name) {
            const firstChar = resource.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Agents and work object names should start with an uppercase letter.', { node: resource, property: 'name' });
            }
        }
    }

    checkNoIntermediateAgents(activity: Activity, accept: ValidationAcceptor): void {
        for (var i=0; i< activity.clauses.length-1; i++) {
            const obj = activity.clauses[i].resource?.declaration.ref;
            if (isAgentDeclaration(obj)) {
                accept('error', 'Only the last element of the activity chain can be an agent.', { node: activity.clauses[i].resource, property: 'declaration'});
            }
        }
        if(activity.clauses.length === 1 && isAgentDeclaration(activity.clauses[0].resource?.declaration.ref)) {
            accept('error', 'An intermediate work object is needed before connecting to an agent.', { node: activity.clauses[0].resource, property: 'declaration'});
        }
    }

    checkMultipleRecipients(clause:ActivityClause, accept: ValidationAcceptor): void {
        if(clause.moreRecipients.length > 0) {
            const decl = clause.resource.declaration.ref;
            if (isWorkObjectDeclaration(decl)) {
                accept('error', 'Multiple recipients at the end of the activity chain must all be agents.', { node: clause.resource, property: 'declaration'});
            }
        }
    }

    checkConnectorStartsWithLower(connector: Connector, accept: ValidationAcceptor): void {
        const ident = connector.name ? connector.name : connector.label;
        if (ident) {
            const firstChar = ident.substring(0, 1);
            if (firstChar.toLowerCase() !== firstChar) {
                accept('warning', 'Connector names should start with a lowercase letter.', { node: connector});
            }
        }
    }
}
