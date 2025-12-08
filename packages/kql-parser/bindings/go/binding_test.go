package tree_sitter_kql_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_kql "github.com/tree-sitter/tree-sitter-kql/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_kql.Language())
	if language == nil {
		t.Errorf("Error loading KQL Parser grammar")
	}
}
