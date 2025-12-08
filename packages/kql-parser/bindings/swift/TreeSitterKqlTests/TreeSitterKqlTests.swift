import XCTest
import SwiftTreeSitter
import TreeSitterKql

final class TreeSitterKqlTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_kql())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading KQL Parser grammar")
    }
}
