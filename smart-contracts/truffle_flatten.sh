#!/usr/bin/env bash

node ./node_modules/.bin/truffle-flattener ./contracts/mock/GenericERC20Token.sol > ./flat/GenericERC20Token.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/TimeLockTokenEscrow.sol > ./flat/TimeLockTokenEscrow.sol;
