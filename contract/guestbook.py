import smartpy as sp


class Comment(sp.Contract):
    def __init__(self):
        # https://tezos.stackexchange.com/questions/3546/smartpy-michelson-errors-only-on-deployment-inconsistent-annotations-inconsist
        self.add_flag("initial-cast")
        self.init(commentList=sp.list(t=sp.TRecord(
            address=sp.TAddress,
            date=sp.TTimestamp,
            text=sp.TString)))

    @sp.entry_point
    def addComment(self, params):
        self.data.commentList.push(sp.record(
            address=sp.sender,
            date=sp.now,
            text=params.text,
        ))

    @sp.add_test(name="Comment")
    def test():
        c1 = Comment()
        scenario = sp.test_scenario()
        scenario.h1("User Data")
        scenario += c1
        scenario += c1.addComment(
            text='Hello',
        ).run(sender=sp.address("tz1W4W2yFAHz7iGyQvFys4K7Df9mZL6cSKCp"))
        scenario += c1.addComment(
            text='Hello Jua',
        ).run(sender=sp.address("tz1W4W2yFAHz7iGyQvFys433Df9mZL6cSKCp"))
