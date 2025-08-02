/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { AstNode, ReferenceInfo, Scope } from 'langium';
import { DefaultScopeProvider, EMPTY_SCOPE } from 'langium';
import { Agent, AgentDeclaration, Footnote, Icon, IconLibrary, isAgent, isAgentDeclaration, isFootnoteLinks, isModel, isResource, isResourceDeclaration, isStory, isStoryBook, Model, Resource, ResourceDeclaration, Story, StoryBook } from './generated/ast.js';

/**
 * Special scope provider that matches symbol names regardless of lowercase or uppercase.
 */
export class DomainStorytellingScopeProvider extends DefaultScopeProvider {

    private ICON_LIBRARY_TYPE = IconLibrary;
    private STORY_BOOK_TYPE = StoryBook;
    private ICON_TYPE = Icon;
    private DECLARATION_TYPE = ResourceDeclaration;
    private FOOTNOTE_TYPE = Footnote;

    override getScope(context: ReferenceInfo): Scope {
        const referenceType = this.reflection.getReferenceType(context);
        const referenceContainer = context.container;

        const model = this.getModel(referenceContainer);
        if (isStory(model)) {
            if (referenceContainer === model && referenceType == this.STORY_BOOK_TYPE) {
                // default scope (top-level element):
                return super.getScope(context);
                
            } else if (isResourceDeclaration(referenceContainer) && referenceType === this.ICON_TYPE) {
                return this.getIconScope(referenceContainer, model, context);

            } else if (isAgent(referenceContainer) && referenceType === this.DECLARATION_TYPE) {
                return this. getAgentScope(referenceContainer, model);

            } else if (isResource(referenceContainer) && referenceType === this.DECLARATION_TYPE) {
                return this. getResourceScope(referenceContainer, model);

            } else if (isFootnoteLinks(referenceContainer) && referenceType === this.FOOTNOTE_TYPE) {
                // default scope (top-level element):
                return super.getScope(context);
                // return this.createScopeForNodes(model.footnotes);
            }
            
        } else if (isStoryBook(model)) {
            if (referenceContainer === model && referenceType == this.ICON_LIBRARY_TYPE) {
                // default scope (top-level element):
                return super.getScope(context);

            } else  if (isResourceDeclaration(referenceContainer) && referenceType === this.ICON_TYPE) {
                return this.getIconScope(referenceContainer, model, context);
            }
        } 
        return super.getScope(context);
    }

    protected getIconScope(resource: ResourceDeclaration, model: Story | StoryBook, context: ReferenceInfo): Scope {
        const book = isStory(model) ? model.book?.ref : model;
        if (book != null) {
            const iconLibrary = book.library.ref;
            if (iconLibrary != null) {
                return this.createScopeForNodes(iconLibrary.icons);
            }
        }
        return EMPTY_SCOPE;
    }

    /**
     * Returns all Agent declarations from the containing Story AND from its referenced StoryBook.
     */
    protected getAgentScope(agent: Agent, story: Story) : Scope {
        const book = story.book?.ref;
        const outerScope = (book != null) ? this.createScopeForNodes(book.declarations.filter((d): d is AgentDeclaration => isAgentDeclaration(d))) : EMPTY_SCOPE;
        return this.createScopeForNodes(story.declarations.filter((a): a is AgentDeclaration => isAgentDeclaration(a)), outerScope);
    }

    /**
     * Returns all resource declarations (Agents AND WorkObjects) from the containing Story AND from its referenced StoryBook.
     */
    protected getResourceScope(resource: Resource, story: Story) : Scope {
        const book = story.book?.ref;
        const outerScope = (book != null) ? this.createScopeForNodes(book.declarations) : EMPTY_SCOPE;
        return this.createScopeForNodes(story.declarations, outerScope);
    }

    protected getModel(node: AstNode): Model | undefined {
        let container = node.$container;
        while (container && !isModel(container)) {
            container = container?.$container;
        }
        return container;
    }   
}
