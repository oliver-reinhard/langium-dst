import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { DeclarationScope, isAgentDeclaration, Story, type DomainStorytellingAstType, type ResourceDeclaration, type Sentence } from './generated/ast.js';
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
        ResourceDeclaration: validator.checkResourceDeclarationStartsWithCapital,
        Sentence: validator.checkNoIntermediateAgents
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

    checkResourceDeclarationStartsWithCapital(resource: ResourceDeclaration, accept: ValidationAcceptor): void {
        if (resource.name) {
            const firstChar = resource.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Agents and WorkObject names should start with a capital letter.', { node: resource, property: 'name' });
            }
        }
    }

    checkNoIntermediateAgents(sentence: Sentence, accept: ValidationAcceptor): void {
        for (var i=0; i< sentence.workObjects.length-1; i++) {
            const obj = sentence.workObjects[i].resource.ref;
            if (isAgentDeclaration(obj)) {
                accept('error', 'Only the last element of a sentence can be an agent.', { node: sentence.workObjects[i], property: 'resource'});
            }
        }
    }

}
