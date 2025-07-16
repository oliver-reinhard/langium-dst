import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { Activity, Connector, DeclarationScope, isAgentDeclaration, Story, type DomainStorytellingAstType, type ResourceDeclaration } from './generated/ast.js';
import type { DomainStorytellingServices } from './domain-storytelling-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: DomainStorytellingServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DomainStorytellingValidator;
    const checks: ValidationChecks<DomainStorytellingAstType> = {
        DeclarationScope: validator.checkUniqueResourceDeclarationName,
        Story: validator.checkResourceDeclarationOverride,
        ResourceDeclaration: validator.checkResourceDeclarationStartsWithUpper,
        Activity: validator.checkNoIntermediateAgents,
        Connector: validator.checkConnectorStartsWithLower
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
                accept('error', `Duplicate name '${decl.name}'`, {node: decl, property: 'name'});
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
                    accept('error', `An agent or work object named '${decl.name}' is already declared in book '${book.name}`, {node: decl, property: 'name'});
                }
            });
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

    checkConnectorStartsWithLower(connector: Connector, accept: ValidationAcceptor): void {
        const ident = connector.name ? connector.name : connector.label;
        if (ident) {
            const firstChar = ident.substring(0, 1);
            if (firstChar.toLowerCase() !== firstChar) {
                accept('warning', 'Connector names should start with a lowercase letter.', { node: connector});
            }
        }
    }

    checkNoIntermediateAgents(activity: Activity, accept: ValidationAcceptor): void {
        for (var i=0; i< activity.clauses.length-1; i++) {
            const obj = activity.clauses[i].resource?.resource.ref;
            if (isAgentDeclaration(obj)) {
                accept('error', 'Only the last element of an activity can be an agent.', { node: activity.clauses[i].resource, property: 'resource'});
            }
        }
        if(activity.clauses.length === 1 && isAgentDeclaration(activity.clauses[0].resource?.resource.ref)) {
            accept('error', 'An intermediate work object is needed before connecting to an agent.', { node: activity.clauses[0].resource, property: 'resource'});
        }
    }

}
